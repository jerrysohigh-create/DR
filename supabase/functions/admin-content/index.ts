import { AppError, cors, db, json, safeError } from "../_shared/security.ts";
import { validateAsset } from "../_shared/asset-validation.ts";
import { deriveCampaignUrl } from "../_shared/campaign-url.ts";
const statuses = new Set([
  "draft",
  "Ready to Publish",
  "Published",
  "paused",
  "archived",
]);
const list = (v: unknown) =>
  Array.isArray(v)
    ? v
        .filter((x) => typeof x === "string")
        .map((x) => (x as string).trim())
        .filter(Boolean)
        .slice(0, 20)
    : [];
const httpUrl = (v: unknown) => {
  try {
    const u = new URL(String(v));
    return ["http:", "https:"].includes(u.protocol) ? u.toString() : null;
  } catch {
    return null;
  }
};
async function audit(client: any, row: any) {
  row.metadata = { ...(row.metadata || {}), outcome: "completed" };
  const { error } = await client.from("audit_logs").insert(row);
  if (error) throw new AppError(502, "audit_write", "Audit write failed");
}
async function auditFailed(client: any, row: any) {
  const { error } = await client
    .from("audit_logs")
    .insert({
      ...row,
      metadata: { ...(row.metadata || {}), outcome: "failed" },
    });
  if (error)
    throw new AppError(500, "audit_write", "Failure audit write failed");
}
Deno.serve(async (req) => {
  const requestId = crypto.randomUUID();
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST")
    return json({ error: "Method not allowed", requestId }, 405);
  try {
    const jwt = (req.headers.get("authorization") || "").replace(
        /^Bearer\s+/i,
        "",
      ),
      client = db();
    if (!jwt) return json({ error: "Unauthorized", requestId }, 401);
    const {
      data: { user },
    } = await client.auth.getUser(jwt);
    if (!user) return json({ error: "Unauthorized", requestId }, 401);
    const { data: staff, error: staffError } = await client
      .from("admin_users")
      .select("role,active")
      .eq("id", user.id)
      .maybeSingle();
    if (staffError)
      throw new AppError(502, "admin_lookup", "Admin lookup failed");
    if (!staff?.active || staff.role !== "admin")
      return json({ error: "Forbidden", requestId }, 403);
    const multipart = (req.headers.get("content-type") || "").includes(
      "multipart/form-data",
    );
    let body: any,
      action: string,
      taskId: string,
      file: File | null = null;
    if (multipart) {
      const form = await req.formData();
      action = String(form.get("action") || "");
      taskId = String(form.get("taskId") || "");
      file = form.get("file") as File;
      body = { oldAssetId: String(form.get("oldAssetId") || "") };
    } else {
      body = await req.json();
      action = String(body.action || "");
      taskId = String(body.taskId || "");
    }
    if (!/^[0-9a-f-]{36}$/i.test(taskId))
      throw new AppError(400, "invalid_task", "Invalid task");
    if (action === "save-task") {
      const d = body.data || {},
        enabled = !!d.campaignLinkEnabled,
        base = enabled ? httpUrl(d.campaignBaseUrl) : null;
      if (enabled && !base)
        throw new AppError(400, "invalid_url", "Campaign URL must be HTTP(S)");
      if (!statuses.has(String(d.status)))
        throw new AppError(400, "invalid_status", "Invalid status");
      const publish = new Date(d.publishAt);
      if (!Number.isFinite(publish.valueOf()))
        throw new AppError(400, "invalid_schedule", "Invalid schedule");
      const derivedUtmRaw = enabled
        ? deriveCampaignUrl(
            base!,
            String(d.utmCampaign || ""),
            String(d.utmContent || ""),
          )
        : "";
      if (enabled && !derivedUtmRaw)
        throw new AppError(
          400,
          "invalid_url",
          "Generated campaign URL is invalid",
        );
      const derivedUtm = derivedUtmRaw || "";
      const update = {
        title: String(d.title || "")
          .trim()
          .slice(0, 160),
        primary_angle: String(d.angle || "")
          .trim()
          .slice(0, 1000),
        approved_copy: String(d.copy || "")
          .trim()
          .slice(0, 10000),
        requirements: list(d.requirements),
        prohibited_claims: list(d.prohibited),
        publish_at: publish.toISOString(),
        status: String(d.status),
        campaign_link_enabled: enabled,
        campaign_base_url: base,
        utm_url: derivedUtm.slice(0, 2048),
        updated_at: new Date().toISOString(),
      };
      if (!update.title || !update.approved_copy)
        throw new AppError(
          400,
          "invalid_content",
          "Title and copy are required",
        );
      const { data: old, error: oldError } = await client
        .from("campaign_tasks")
        .select("*")
        .eq("id", taskId)
        .single();
      if (oldError) throw new AppError(404, "not_found", "Task not found");
      const { error } = await client
        .from("campaign_tasks")
        .update(update)
        .eq("id", taskId);
      if (error) throw new AppError(502, "task_write", "Task save failed");
      try {
        await audit(client, {
          actor_id: user.id,
          action: "task_content_saved",
          entity_type: "campaign_tasks",
          entity_id: taskId,
          metadata: { status: update.status, campaign_link_enabled: enabled },
        });
      } catch (e) {
        const rollback = await client
          .from("campaign_tasks")
          .update(old)
          .eq("id", taskId);
        if (rollback.error)
          throw new AppError(
            500,
            "compensation_failed",
            "Task rollback failed",
          );
        throw e;
      }
      return json({ ok: true });
    }
    if (action === "upload-asset") {
      if (!(file instanceof File))
        throw new AppError(400, "missing_file", "File is required");
      const head = new Uint8Array(await file.slice(0, 16).arrayBuffer()),
        checked = validateAsset(file.type, file.size, head);
      if ("error" in checked)
        throw new AppError(400, "invalid_asset", checked.error!);
      const { count, error: countError } = await client
        .from("task_assets")
        .select("id", { count: "exact", head: true })
        .eq("task_id", taskId)
        .eq("active", true);
      if (countError)
        throw new AppError(502, "asset_count", "Asset count failed");
      const oldId = body.oldAssetId;
      if ((count || 0) >= 10 && !oldId)
        throw new AppError(
          409,
          "asset_limit",
          "A task can have at most 10 active assets",
        );
      let old: any = null;
      if (oldId) {
        const r = await client
          .from("task_assets")
          .select("*")
          .eq("task_id", taskId)
          .eq("id", oldId)
          .eq("active", true)
          .maybeSingle();
        if (r.error || !r.data)
          throw new AppError(404, "old_asset", "Replacement target not found");
        old = r.data;
      }
      const path = `${taskId}/${crypto.randomUUID()}.${checked.rule!.ext}`,
        bytes = await file.arrayBuffer();
      const upload = await client.storage
        .from("kol-assets")
        .upload(path, bytes, { contentType: file.type, upsert: false });
      if (upload.error)
        throw new AppError(502, "storage_upload", "Storage upload failed");
      let created: any;
      try {
        const insert = await client
          .from("task_assets")
          .insert({
            task_id: taskId,
            asset_type: checked.rule!.type,
            file_name: file.name.slice(0, 255),
            public_url: "",
            storage_path: path,
            mime_type: file.type,
            size_bytes: file.size,
            sort_order: old?.sort_order ?? count ?? 0,
          })
          .select("id")
          .single();
        if (insert.error)
          throw new AppError(502, "asset_insert", "Asset registration failed");
        created = insert.data;
        if (old) {
          const off = await client
            .from("task_assets")
            .update({ active: false, updated_at: new Date().toISOString() })
            .eq("id", old.id);
          if (off.error)
            throw new AppError(502, "replace_update", "Replacement failed");
        }
        await audit(client, {
          actor_id: user.id,
          action: old ? "asset_replaced" : "asset_uploaded",
          entity_type: "task_assets",
          entity_id: created.id,
          metadata: {
            task_id: taskId,
            type: checked.rule!.type,
            size_bytes: file.size,
            old_asset_id: old?.id,
          },
        });
      } catch (e) {
        const failures = [];
        if (created) {
          const r = await client
            .from("task_assets")
            .delete()
            .eq("id", created.id);
          if (r.error) failures.push("new_row");
        }
        const sr = await client.storage.from("kol-assets").remove([path]);
        if (sr.error) failures.push("storage");
        if (old) {
          const r = await client
            .from("task_assets")
            .update({ active: true })
            .eq("id", old.id);
          if (r.error) failures.push("old_row");
        }
        const failedAudit = await client.from("audit_logs").insert({
          actor_id: user.id,
          action: old ? "asset_replace_failed" : "asset_upload_failed",
          entity_type: "task_assets",
          entity_id: taskId,
          metadata: { outcome: "failed", compensation_failures: failures },
        });
        if (failedAudit.error || failures.length)
          throw new AppError(
            500,
            "compensation_failed",
            "Asset compensation failed",
          );
        throw e;
      }
      return json({ id: created.id });
    }
    if (action === "reorder-assets") {
      const ids = Array.isArray(body.assetIds)
        ? body.assetIds
            .map(String)
            .filter((x: string) => /^[0-9a-f-]{36}$/i.test(x))
            .slice(0, 10)
        : [];
      const { data: before, error: readError } = await client
        .from("task_assets")
        .select("id,sort_order")
        .eq("task_id", taskId)
        .eq("active", true);
      if (
        readError ||
        ids.length !== before?.length ||
        !ids.every((id: string) => before.some((x: any) => x.id === id))
      )
        throw new AppError(
          400,
          "invalid_order",
          "Order must contain every active asset",
        );
      try {
        for (let i = 0; i < ids.length; i++) {
          const { error } = await client
            .from("task_assets")
            .update({ sort_order: i, updated_at: new Date().toISOString() })
            .eq("id", ids[i]);
          if (error) throw new AppError(502, "reorder_write", "Reorder failed");
        }
        await audit(client, {
          actor_id: user.id,
          action,
          entity_type: "task_assets",
          entity_id: taskId,
          metadata: { count: ids.length },
        });
      } catch (e) {
        const failures = [];
        for (const x of before) {
          const r = await client
            .from("task_assets")
            .update({ sort_order: x.sort_order })
            .eq("id", x.id);
          if (r.error) failures.push(x.id);
        }
        await auditFailed(client, {
          actor_id: user.id,
          action: "reorder_assets_failed",
          entity_type: "task_assets",
          entity_id: taskId,
          metadata: { compensation_failures: failures },
        });
        if (failures.length)
          throw new AppError(
            500,
            "compensation_failed",
            "Reorder rollback failed",
          );
        throw e;
      }
      return json({ ok: true });
    }
    if (["deactivate-asset", "delete-asset"].includes(action)) {
      const id = String(body.assetId || ""),
        found = await client
          .from("task_assets")
          .select("*")
          .eq("task_id", taskId)
          .eq("id", id)
          .maybeSingle();
      if (found.error || !found.data)
        throw new AppError(404, "not_found", "Asset not found");
      const a = found.data;
      if (action === "deactivate-asset") {
        const r = await client
          .from("task_assets")
          .update({ active: false, updated_at: new Date().toISOString() })
          .eq("id", id);
        if (r.error)
          throw new AppError(502, "asset_update", "Deactivate failed");
        try {
          await audit(client, {
            actor_id: user.id,
            action,
            entity_type: "task_assets",
            entity_id: id,
            metadata: { task_id: taskId },
          });
        } catch (e) {
          const rollback = await client
            .from("task_assets")
            .update({ active: a.active })
            .eq("id", id);
          await auditFailed(client, {
            actor_id: user.id,
            action: "deactivate_asset_failed",
            entity_type: "task_assets",
            entity_id: id,
            metadata: {
              task_id: taskId,
              compensation_failed: !!rollback.error,
            },
          });
          if (rollback.error)
            throw new AppError(
              500,
              "compensation_failed",
              "Deactivate rollback failed",
            );
          throw e;
        }
      } else {
        await audit(client, {
          actor_id: user.id,
          action: "asset_delete_requested",
          entity_type: "task_assets",
          entity_id: id,
          metadata: { task_id: taskId },
        });
        const del = await client.from("task_assets").delete().eq("id", id);
        if (del.error) {
          await auditFailed(client, {
            actor_id: user.id,
            action: "asset_delete_failed",
            entity_type: "task_assets",
            entity_id: id,
            metadata: { task_id: taskId, stage: "database" },
          });
          throw new AppError(502, "asset_delete", "Delete failed");
        }
        const storage = a.storage_path
          ? await client.storage.from("kol-assets").remove([a.storage_path])
          : { error: null };
        if (storage.error) {
          const restore = await client.from("task_assets").insert(a);
          await auditFailed(client, {
            actor_id: user.id,
            action: "asset_delete_failed",
            entity_type: "task_assets",
            entity_id: id,
            metadata: {
              task_id: taskId,
              stage: "storage",
              compensation_failed: !!restore.error,
            },
          });
          if (restore.error)
            throw new AppError(
              500,
              "compensation_failed",
              "Delete rollback failed",
            );
          throw new AppError(502, "storage_delete", "Storage delete failed");
        }
        try {
          await audit(client, {
            actor_id: user.id,
            action: "asset_deleted",
            entity_type: "task_assets",
            entity_id: id,
            metadata: { task_id: taskId },
          });
        } catch (e) {
          await auditFailed(client, {
            actor_id: user.id,
            action: "asset_delete_failed",
            entity_type: "task_assets",
            entity_id: id,
            metadata: { task_id: taskId, stage: "completion_audit" },
          });
          throw e;
        }
      }
      return json({ ok: true });
    }
    throw new AppError(400, "invalid_action", "Unsupported action");
  } catch (error) {
    return safeError(error, requestId);
  }
});
