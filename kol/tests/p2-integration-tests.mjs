import { readFile } from 'node:fs/promises';

const files = Object.fromEntries(await Promise.all([
  'supabase/functions/_shared/security.ts',
  'supabase/functions/get-task/index.ts',
  'supabase/functions/submit-post/index.ts',
  'supabase/functions/collect-metrics/index.ts',
  'supabase/functions/admin-export/index.ts',
  'supabase/config.toml',
  'supabase/seed-demo.sql',
  'supabase/scripts/generate-test-tokens.mjs',
  'kol/js/config.runtime.js',
].map(async (path) => [path, await readFile(path, 'utf8')])));

const results = [];
const check = (name, pass) => { results.push({ name, pass }); if (!pass) process.exitCode = 1; };
const shared = files['supabase/functions/_shared/security.ts'];
const metrics = files['supabase/functions/collect-metrics/index.ts'];
check('database fetch has AbortSignal deadline', shared.includes('AbortSignal.timeout') && shared.includes('global: { fetch: timedFetch }'));
check('DB timeout config is finite positive and capped', shared.includes('Number.isFinite(configured)') && shared.includes('configured > 0') && shared.includes('configured <= 30000'));
check('structured errors contain requestId without input data', shared.includes("requestId, code, status") && !shared.includes('console.error(error)'));
for (const name of ['get-task', 'submit-post', 'admin-export']) {
  const source = files[`supabase/functions/${name}/index.ts`];
  check(`${name} uses safe error boundary`, source.includes('safeError(error, requestId)'));
}
check('external metrics fetch has AbortSignal deadline', metrics.includes('AbortSignal.timeout(10000)'));
check('mock mode is explicit and default', metrics.includes("const mode = Deno.env.get('METRICS_MODE') || 'mock'"));
check('mock supports 24h and 7d only', metrics.includes("['24h', '7d'].includes(snapshotType)"));
check('mock payload is visibly marked', metrics.includes('mock: true'));
check('mock fixtures cover persisted nulls', metrics.includes("'24h': { views: 1200") && metrics.includes('bookmarks: null') && metrics.includes("'7d': { views: 4800") && metrics.includes('quotes: null'));
check('metrics requires CRON_SECRET', metrics.includes("req.headers.get('x-cron-secret') !== cronSecret"));
check('null values remain null', metrics.includes('numberOrNull'));
const runtime = files['kol/js/config.runtime.js'];
check('runtime config passed live smoke release gate for test project', runtime.includes('USE_DEMO_DATA:false') && runtime.includes('Supabase test project'));
check('runtime config contains no privileged key', !/sb_secret_[A-Za-z0-9_-]+|eyJ[A-Za-z0-9_-]{20,}|sbp_[A-Za-z0-9]+/.test(runtime));
const functionConfig = files['supabase/config.toml'];
check('public functions disable gateway JWT verification', ['get-task', 'submit-post', 'collect-metrics'].every((name) => functionConfig.includes(`[functions.${name}]\nverify_jwt = false`)));
check('admin export requires gateway JWT verification', functionConfig.includes('[functions.admin-export]\nverify_jwt = true'));
const seed = files['supabase/seed-demo.sql'];
check('database seed contains no fixed raw tokens or hashes', !/TEST_(TOKEN|DRAGON|KRYPTO)|insert\s+into\s+public\.task_access_tokens|digest\s*\(/i.test(seed));
const provisioner = files['supabase/scripts/generate-test-tokens.mjs'];
check('token provisioner uses random bytes and SHA-256', provisioner.includes('randomBytes(32)') && provisioner.includes("createHash('sha256')"));
check('token provisioner requires out-of-repo 0600 output', provisioner.includes('outside the repository') && provisioner.includes('mode: 0o600'));
check('token provisioner reserves recovery file before DB insert', provisioner.indexOf("flag: 'wx'") < provisioner.indexOf("/rest/v1/task_access_tokens") && provisioner.includes('await unlink(output)'));
console.log(JSON.stringify(results, null, 2));
