// Optional live integration suite. It is a safe SKIP unless explicitly enabled with local environment variables.
// Never print environment values, request bodies, task URLs, or server response bodies.
const enabled = process.env.KOL_LIVE_TESTS === '1';
if (!enabled) {
  console.log(JSON.stringify({ suite: 'p2-live', status: 'SKIP', reason: 'KOL_LIVE_TESTS is not enabled' }));
  process.exit(0);
}

const required = [
  'KOL_SUPABASE_URL', 'KOL_PUBLISHABLE_KEY',
  'KOL_ACTIVE_SLUG', 'KOL_ACTIVE_TOKEN',
  'KOL_EXPIRED_SLUG', 'KOL_EXPIRED_TOKEN',
  'KOL_REVOKED_SLUG', 'KOL_REVOKED_TOKEN',
  'KOL_MATCHING_POST_URL', 'KOL_TEST_SUBMISSION_ID',
  'KOL_CRON_SECRET', 'KOL_TEST_SECRET_KEY',
];
const missing = required.filter((name) => !process.env[name]);
if (missing.length) {
  console.error(JSON.stringify({ suite: 'p2-live', status: 'FAIL', reason: 'required local variables missing', names: missing }));
  process.exit(1);
}
if (process.env.KOL_LIVE_MUTATION_TESTS !== '1' || process.env.KOL_LIVE_METRICS_TESTS !== '1') {
  console.error(JSON.stringify({ suite: 'p2-live', status: 'FAIL', reason: 'mutation and metrics release gates must both equal 1' }));
  process.exit(1);
}

const base = process.env.KOL_SUPABASE_URL.replace(/\/$/, '');
const publicHeaders = {
  'content-type': 'application/json',
  apikey: process.env.KOL_PUBLISHABLE_KEY,
};
const results = [];
const check = (name, pass, status) => { results.push({ name, pass, status }); if (!pass) process.exitCode = 1; };
async function postFunction(name, body, extraHeaders = {}) {
  try {
    const response = await fetch(`${base}/functions/v1/${name}`, {
      method: 'POST', headers: { ...publicHeaders, ...extraHeaders }, body: JSON.stringify(body), signal: AbortSignal.timeout(20000),
    });
    return { status: response.status };
  } catch (error) {
    return { status: error?.name === 'TimeoutError' ? 504 : 0 };
  }
}

let response = await postFunction('get-task', { slug: process.env.KOL_ACTIVE_SLUG, token: process.env.KOL_ACTIVE_TOKEN });
check('correct token', response.status === 200, response.status);
response = await postFunction('get-task', { slug: process.env.KOL_ACTIVE_SLUG, token: 'deliberately-wrong-token' });
check('wrong token', response.status === 403, response.status);
response = await postFunction('get-task', { slug: process.env.KOL_EXPIRED_SLUG, token: process.env.KOL_EXPIRED_TOKEN });
check('expired token', response.status === 403, response.status);
response = await postFunction('get-task', { slug: process.env.KOL_REVOKED_SLUG, token: process.env.KOL_REVOKED_TOKEN });
check('revoked token', response.status === 403, response.status);
response = await postFunction('submit-post', { slug: process.env.KOL_ACTIVE_SLUG, token: process.env.KOL_ACTIVE_TOKEN, postUrl: 'https://example.com/not-x/status/123' });
check('invalid X URL', response.status === 400, response.status);
response = await postFunction('submit-post', { slug: process.env.KOL_ACTIVE_SLUG, token: process.env.KOL_ACTIVE_TOKEN, postUrl: 'https://x.com/definitely_wrong_handle/status/999999999999999999' });
check('X account mismatch', response.status === 403, response.status);

const admin = await fetch(`${base}/functions/v1/admin-export`, { headers: { apikey: process.env.KOL_PUBLISHABLE_KEY }, signal: AbortSignal.timeout(20000) });
check('Admin unauthenticated', admin.status === 401, admin.status);

const body = { slug: process.env.KOL_ACTIVE_SLUG, token: process.env.KOL_ACTIVE_TOKEN, postUrl: process.env.KOL_MATCHING_POST_URL };
const first = await postFunction('submit-post', body);
check('correct X Post URL', first.status === 201, first.status);
const duplicate = await postFunction('submit-post', body);
check('duplicate submission', duplicate.status === 409, duplicate.status);

for (const snapshotType of ['24h', '7d']) {
  const metric = await postFunction('collect-metrics', { submissionId: process.env.KOL_TEST_SUBMISSION_ID, snapshotType }, { 'x-cron-secret': process.env.KOL_CRON_SECRET });
  check(`${snapshotType} mock snapshot`, metric.status === 200, metric.status);
}
const dbResponse = await fetch(`${base}/rest/v1/metric_snapshots?submission_id=eq.${encodeURIComponent(process.env.KOL_TEST_SUBMISSION_ID)}&snapshot_type=in.(24h,7d)&select=snapshot_type,source,raw_payload,quotes,bookmarks`, {
  headers: { apikey: process.env.KOL_TEST_SECRET_KEY, authorization: `Bearer ${process.env.KOL_TEST_SECRET_KEY}` }, signal: AbortSignal.timeout(20000),
});
const rows = dbResponse.ok ? await dbResponse.json() : [];
check('mock snapshots stored and marked', rows.length >= 2 && rows.every((row) => row.source === 'mock' && row.raw_payload?.mock === true), dbResponse.status);
check('null metrics remain null', rows.some((row) => row.snapshot_type === '24h' && row.bookmarks === null) && rows.some((row) => row.snapshot_type === '7d' && row.quotes === null), dbResponse.status);

console.log(JSON.stringify({ suite: 'p2-live', results }, null, 2));
