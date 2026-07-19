import { AppError, cors, db, json, safeError } from '../_shared/security.ts';

const allowed = new Set(['initial', '24h', '48h_retry', '7d', '8d_retry', 'manual']);
const numberOrNull = (value: unknown) => value == null ? null : Number.isFinite(Number(value)) ? Number(value) : null;

function mockPayload(snapshotType: string) {
  // Deterministic fixtures validate storage and dashboard flows; they are never presented as real X metrics.
  const fixtures: Record<string, Record<string, number | string | boolean | null>> = {
    '24h': { views: 1200, likes: 84, replies: 7, reposts: 19, quotes: 3, bookmarks: null },
    '7d': { views: 4800, likes: 260, replies: 24, reposts: 71, quotes: null, bookmarks: 39 },
  };
  return { ...(fixtures[snapshotType] || fixtures['24h']), mock: true, fixture: `kol-${snapshotType}` };
}

async function externalJson(url: string, init: RequestInit) {
  const response = await fetch(url, { ...init, signal: AbortSignal.timeout(10000) });
  if (!response.ok) throw new AppError(502, 'metrics_provider', 'Metrics provider failed');
  return response.json();
}

async function apify(url: string) {
  const token = Deno.env.get('APIFY_TOKEN');
  const actor = Deno.env.get('APIFY_ACTOR_ID');
  if (!token || !actor) throw new AppError(503, 'apify_unconfigured', 'Apify is not configured');
  const items = await externalJson(
    `https://api.apify.com/v2/acts/${encodeURIComponent(actor)}/run-sync-get-dataset-items?token=${encodeURIComponent(token)}`,
    { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ startUrls: [{ url }] }) },
  );
  return items[0];
}

async function twstalker(url: string) {
  const endpoint = Deno.env.get('TWSTALKER_ENDPOINT');
  if (!endpoint) throw new AppError(503, 'twstalker_unconfigured', 'TwStalker is not configured');
  return externalJson(endpoint, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ url }),
  });
}

Deno.serve(async (req) => {
  const requestId = crypto.randomUUID();
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'Method not allowed', requestId }, 405);
  const cronSecret = Deno.env.get('CRON_SECRET');
  if (!cronSecret || req.headers.get('x-cron-secret') !== cronSecret) return json({ error: 'Unauthorized', requestId }, 401);
  try {
    const { submissionId, snapshotType } = await req.json();
    if (!submissionId || !allowed.has(snapshotType)) return json({ error: 'Invalid snapshot request', requestId }, 400);
    const client = db();
    const { data: submission, error: selectError } = await client.from('post_submissions')
      .select('submitted_url').eq('id', submissionId).maybeSingle();
    if (selectError) throw new AppError(502, 'database_query', 'Submission lookup failed');
    if (!submission) return json({ error: 'Submission not found', requestId }, 404);

    const mode = Deno.env.get('METRICS_MODE') || 'mock';
    let payload: any = null;
    let source = 'mock';
    let status = 'ok';
    if (mode === 'mock') {
      if (!['24h', '7d'].includes(snapshotType)) return json({ error: 'Mock mode supports only 24h and 7d', requestId }, 400);
      payload = mockPayload(snapshotType);
    } else if (mode === 'live') {
      try {
        payload = await apify(submission.submitted_url);
        source = 'apify';
      } catch {
        try {
          payload = await twstalker(submission.submitted_url);
          source = 'twstalker';
        } catch {
          source = 'none';
          status = 'manual_review';
        }
      }
    } else {
      throw new AppError(500, 'metrics_mode', 'Metrics mode is invalid');
    }

    const { error } = await client.from('metric_snapshots').insert({
      submission_id: submissionId,
      snapshot_type: snapshotType,
      source,
      status,
      views: numberOrNull(payload?.views),
      likes: numberOrNull(payload?.likes),
      replies: numberOrNull(payload?.replies),
      reposts: numberOrNull(payload?.reposts),
      quotes: numberOrNull(payload?.quotes),
      bookmarks: numberOrNull(payload?.bookmarks),
      raw_payload: payload,
    });
    if (error) throw new AppError(502, 'database_write', 'Metric snapshot could not be saved');
    return json({ status, source, snapshotType, mock: mode === 'mock' });
  } catch (error) {
    return safeError(error, requestId);
  }
});
