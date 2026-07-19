import { AppError, cors, db, json, safeError } from "../_shared/security.ts";

Deno.serve(async (req) => {
  const requestId = crypto.randomUUID();
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "GET")
    return json({ error: "Method not allowed", requestId }, 405);
  try {
    const auth = req.headers.get("authorization") || "";
    const jwt = auth.replace(/^Bearer\s+/i, "");
    if (!jwt) return json({ error: "Unauthorized", requestId }, 401);
    const client = db();
    const {
      data: { user },
      error: userError,
    } = await client.auth.getUser(jwt);
    if (userError || !user)
      return json({ error: "Unauthorized", requestId }, 401);
    const { data: admin, error: adminError } = await client
      .from("admin_users")
      .select("role,active")
      .eq("id", user.id)
      .maybeSingle();
    if (adminError)
      throw new AppError(502, "database_query", "Admin lookup failed");
    if (!admin?.active || !["admin", "editor"].includes(admin.role))
      return json({ error: "Forbidden", requestId }, 403);
    const { data, error } = await client
      .from("campaign_tasks")
      .select(
        "id,title,wave,publish_at,status,primary_angle,approved_copy,requirements,prohibited_claims,campaign_link_enabled,campaign_base_url,utm_url,kol_profiles!inner(slug,x_handle,display_name),task_assets(id,asset_type,file_name,storage_path,public_url,mime_type,size_bytes,sort_order,active),post_submissions(id,submitted_url,submitted_at,verification_status,metric_snapshots(snapshot_type,captured_at,source,views,likes,replies,reposts,quotes,bookmarks,status,evidence_url))",
      )
      .order("publish_at");
    if (error) throw new AppError(502, "database_query", "Export failed");
    const { error: auditError } = await client.from("audit_logs").insert({
      actor_id: user.id,
      action: "admin_export",
      entity_type: "campaign_tasks",
      metadata: { row_count: data?.length || 0 },
    });
    if (auditError)
      console.error(JSON.stringify({ requestId, code: "audit_write_failed" }));
    const paths = (data || []).flatMap((t: any) =>
      (t.task_assets || [])
        .filter((a: any) => a.storage_path)
        .map((a: any) => a.storage_path),
    );
    const signed = paths.length
      ? await client.storage.from("kol-assets").createSignedUrls(paths, 900)
      : { data: [] };
    const urls = new Map(
      (signed.data || []).map((x: any) => [x.path, x.signedUrl]),
    );
    const rows = (data || []).map((t: any) => ({
      ...t,
      task_assets: (t.task_assets || [])
        .sort((a: any, b: any) => a.sort_order - b.sort_order)
        .map((a: any) => ({
          ...a,
          preview_url: a.storage_path ? urls.get(a.storage_path) : a.public_url,
        })),
    }));
    return json({ rows });
  } catch (error) {
    return safeError(error, requestId);
  }
});
