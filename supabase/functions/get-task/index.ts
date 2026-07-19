import { access, cors, json, safeError } from "../_shared/security.ts";
import { canAccessTaskContent } from "../_shared/task-visibility.ts";

Deno.serve(async (req) => {
  const requestId = crypto.randomUUID();
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST")
    return json({ error: "Method not allowed", requestId }, 405);
  try {
    const { slug, token } = await req.json();
    const result = await access(slug, token);
    if (!result)
      return json(
        { error: "Invalid, expired or revoked task link", requestId },
        403,
      );
    const task: any = result.task;
    if (!canAccessTaskContent(task.status))
      return json({ error: "Task is not published", requestId }, 403);
    const stored = (task.task_assets || []).filter(
      (x: any) => x.active && x.storage_path,
    );
    const signed = stored.length
      ? await result.client.storage.from("kol-assets").createSignedUrls(
          stored.map((x: any) => x.storage_path),
          3600,
        )
      : { data: [] };
    const signedByPath = new Map(
      (signed.data || []).map((x: any) => [x.path, x.signedUrl]),
    );
    return json({
      slug,
      handle: task.kol_profiles.x_handle,
      name: task.kol_profiles.display_name,
      wave: task.wave,
      status: task.status,
      publishAt: task.publish_at,
      angle: task.primary_angle,
      copy: task.approved_copy,
      title: task.title,
      utm: task.campaign_link_enabled ? task.utm_url : "",
      requirements: task.requirements,
      prohibited: (task.prohibited_claims || []).join(" · "),
      assets: (task.task_assets || [])
        .filter((x: any) => x.active)
        .sort((a: any, b: any) => a.sort_order - b.sort_order)
        .map((x: any) => ({
          type: x.asset_type,
          name: x.file_name,
          url: x.storage_path ? signedByPath.get(x.storage_path) : x.public_url,
        }))
        .filter((x: any) => x.url),
    });
  } catch (error) {
    return safeError(error, requestId);
  }
});
