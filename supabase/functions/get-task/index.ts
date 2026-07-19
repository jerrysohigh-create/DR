import { access, cors, json, safeError } from '../_shared/security.ts';

Deno.serve(async (req) => {
  const requestId = crypto.randomUUID();
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'Method not allowed', requestId }, 405);
  try {
    const { slug, token } = await req.json();
    const result = await access(slug, token);
    if (!result) return json({ error: 'Invalid, expired or revoked task link', requestId }, 403);
    const task: any = result.task;
    return json({
      slug,
      handle: task.kol_profiles.x_handle,
      name: task.kol_profiles.display_name,
      wave: task.wave,
      status: task.status,
      publishAt: task.publish_at,
      angle: task.primary_angle,
      copy: task.approved_copy,
      utm: task.utm_url,
      requirements: task.requirements,
      prohibited: (task.prohibited_claims || []).join(' · '),
      assets: (task.task_assets || []).filter((x: any) => x.active).map((x: any) => ({
        type: x.asset_type, name: x.file_name, url: x.public_url,
      })),
    });
  } catch (error) {
    return safeError(error, requestId);
  }
});
