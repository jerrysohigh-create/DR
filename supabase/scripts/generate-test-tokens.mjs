// Run locally only. Generates random raw tokens, stores hashes in Supabase, and writes raw URLs outside the repo (0600).
import { createHash, randomBytes } from 'node:crypto';
import { chmod, unlink, writeFile } from 'node:fs/promises';
import { isAbsolute, relative, resolve } from 'node:path';

const required = ['KOL_SUPABASE_URL', 'KOL_TEST_SECRET_KEY', 'KOL_TOKEN_OUTPUT'];
const missing = required.filter((name) => !process.env[name]);
if (missing.length) throw new Error(`Missing local environment variables: ${missing.join(', ')}`);
const output = resolve(process.env.KOL_TOKEN_OUTPUT);
const rel = relative(process.cwd(), output);
if (!isAbsolute(process.env.KOL_TOKEN_OUTPUT) || (!rel.startsWith('..') && !isAbsolute(rel))) {
  throw new Error('KOL_TOKEN_OUTPUT must be an absolute path outside the repository');
}
const base = process.env.KOL_SUPABASE_URL.replace(/\/$/, '');
const secret = process.env.KOL_TEST_SECRET_KEY;
const headers = { apikey: secret, authorization: `Bearer ${secret}`, 'content-type': 'application/json' };
const taskResponse = await fetch(`${base}/rest/v1/campaign_tasks?stage=eq.demo&select=id,kol_profiles!inner(slug,x_handle)`, { headers, signal: AbortSignal.timeout(20000) });
if (!taskResponse.ok) throw new Error(`Task lookup failed with HTTP ${taskResponse.status}`);
const tasks = await taskResponse.json();
if (tasks.length !== 3) throw new Error(`Expected exactly three Demo tasks, found ${tasks.length}`);
const token = () => randomBytes(32).toString('base64url');
const hash = (raw) => createHash('sha256').update(raw).digest('hex');
const now = Date.now();
const records = [];
for (const task of tasks) {
  const raw = token();
  records.push({ task_id: task.id, token_hash: hash(raw), expires_at: new Date(now + 30 * 86400000).toISOString() });
  task.raw = raw;
}
const expiredRaw = token();
const revokedRaw = token();
records.push({ task_id: tasks[0].id, token_hash: hash(expiredRaw), expires_at: new Date(now - 86400000).toISOString() });
records.push({ task_id: tasks[0].id, token_hash: hash(revokedRaw), expires_at: new Date(now + 30 * 86400000).toISOString(), revoked_at: new Date().toISOString() });
const outputData = {
  generated_at: new Date().toISOString(),
  tasks: tasks.map((task) => ({ slug: task.kol_profiles.slug, handle: task.kol_profiles.x_handle, token: task.raw })),
  negative_tests: { slug: tasks[0].kol_profiles.slug, expired_token: expiredRaw, revoked_token: revokedRaw },
};
// Reserve and fully write the exclusive 0600 recovery file before creating any database hashes.
await writeFile(output, JSON.stringify(outputData, null, 2), { mode: 0o600, flag: 'wx' });
try {
  await chmod(output, 0o600);
  const insert = await fetch(`${base}/rest/v1/task_access_tokens`, { method: 'POST', headers, body: JSON.stringify(records), signal: AbortSignal.timeout(20000) });
  if (!insert.ok) throw new Error(`Token hash insert failed with HTTP ${insert.status}`);
} catch (error) {
  await unlink(output).catch(() => {});
  throw error;
}
console.log(JSON.stringify({ status: 'ok', active_tokens: tasks.length, negative_test_tokens: 2, output_written: true }));
