import { createClient } from 'npm:@supabase/supabase-js@2';

export const cors = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
};

export const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...cors, 'content-type': 'application/json', 'cache-control': 'no-store' },
});

export class AppError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
  }
}

const timeoutMs = () => {
  const configured = Number(Deno.env.get('DB_TIMEOUT_MS'));
  return Number.isFinite(configured) && configured > 0 && configured <= 30000 ? configured : 8000;
};

function combinedSignal(existing?: AbortSignal | null) {
  const deadline = AbortSignal.timeout(timeoutMs());
  return existing ? AbortSignal.any([existing, deadline]) : deadline;
}

export const timedFetch: typeof fetch = (input, init = {}) => fetch(input, {
  ...init,
  signal: combinedSignal(init.signal),
});

export const db = () => {
  const url = Deno.env.get('SUPABASE_URL');
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) throw new AppError(500, 'server_config', 'Server configuration is incomplete');
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: timedFetch },
  });
};

export const sha256 = async (value: string) => Array.from(
  new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))),
).map((x) => x.toString(16).padStart(2, '0')).join('');

export async function access(slug: string, token: string) {
  if (!slug || !token || token.length > 256 || slug.length > 100) return null;
  const client = db();
  const hash = await sha256(token);
  const { data, error } = await client.from('task_access_tokens')
    .select('task_id,expires_at,revoked_at').eq('token_hash', hash).maybeSingle();
  if (error) throw new AppError(502, 'database_query', 'Token lookup failed');
  if (!data || data.revoked_at || !data.expires_at || new Date(data.expires_at) <= new Date()) return null;
  const { data: task, error: taskError } = await client.from('campaign_tasks')
    .select('*,kol_profiles!inner(*),task_assets(*)').eq('id', data.task_id).maybeSingle();
  if (taskError) throw new AppError(502, 'database_query', 'Task lookup failed');
  if (!task || task.kol_profiles.slug !== slug) return null;
  return { client, data, task };
}

export function postUrl(value: string) {
  try {
    const url = new URL(value);
    if (!['x.com', 'www.x.com', 'twitter.com', 'www.twitter.com'].includes(url.hostname.toLowerCase())) return null;
    const match = url.pathname.match(/^\/([^/]+)\/status\/(\d+)(?:\/|$)/i);
    return match ? { url: `https://x.com/${match[1]}/status/${match[2]}`, username: match[1], postId: match[2] } : null;
  } catch {
    return null;
  }
}

export function safeError(error: unknown, requestId: string) {
  const timeout = error instanceof DOMException && error.name === 'TimeoutError';
  const app = error instanceof AppError ? error : null;
  const status = timeout ? 504 : app?.status || 500;
  const code = timeout ? 'upstream_timeout' : app?.code || 'internal_error';
  console.error(JSON.stringify({ requestId, code, status }));
  return json({ error: timeout ? 'Upstream request timed out' : app?.message || 'Request failed', code, requestId }, status);
}
