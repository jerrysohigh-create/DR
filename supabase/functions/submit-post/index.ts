import { access, AppError, cors, json, postUrl, safeError } from '../_shared/security.ts';

Deno.serve(async (req) => {
  const requestId = crypto.randomUUID();
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'Method not allowed', requestId }, 405);
  try {
    const { slug, token, postUrl: raw } = await req.json();
    const result = await access(slug, token);
    const parsed = postUrl(raw);
    if (!result) return json({ error: 'Invalid, expired or revoked task link', requestId }, 403);
    if (!parsed) return json({ error: 'Invalid X post URL', requestId }, 400);
    const expected = (result.task as any).kol_profiles.x_handle.replace(/^@/, '');
    if (parsed.username.toLowerCase() !== expected.toLowerCase()) {
      return json({ error: 'X username does not match this task', requestId }, 403);
    }
    const { data, error } = await result.client.from('post_submissions').insert({
      task_id: result.data.task_id,
      submitted_url: parsed.url,
      x_username: parsed.username,
      post_id: parsed.postId,
    }).select('submitted_at').single();
    if (error?.code === '23505') return json({ error: 'This task or post was already submitted', requestId }, 409);
    if (error) throw new AppError(502, 'database_write', 'Submission could not be saved');
    return json({ submittedAt: data.submitted_at }, 201);
  } catch (error) {
    return safeError(error, requestId);
  }
});
