// Local-only token rotation. Raw token is written to a new 0600 file outside the repository; Supabase stores SHA-256 only.
import { createHash, randomBytes } from "node:crypto";
import { chmod, unlink, writeFile } from "node:fs/promises";
import { isAbsolute, relative, resolve } from "node:path";
const required = [
    "KOL_SUPABASE_URL",
    "KOL_TEST_SECRET_KEY",
    "KOL_TASK_SLUG",
    "KOL_TOKEN_OUTPUT",
  ],
  missing = required.filter((x) => !process.env[x]);
if (missing.length)
  throw Error(`Missing local environment variables: ${missing.join(", ")}`);
const output = resolve(process.env.KOL_TOKEN_OUTPUT),
  rel = relative(process.cwd(), output);
if (
  !isAbsolute(process.env.KOL_TOKEN_OUTPUT) ||
  (!rel.startsWith("..") && !isAbsolute(rel))
)
  throw Error(
    "KOL_TOKEN_OUTPUT must be an absolute path outside the repository",
  );
const base = process.env.KOL_SUPABASE_URL.replace(/\/$/, ""),
  secret = process.env.KOL_TEST_SECRET_KEY,
  headers = {
    apikey: secret,
    authorization: `Bearer ${secret}`,
    "content-type": "application/json",
  },
  slug = encodeURIComponent(process.env.KOL_TASK_SLUG);
const lookup = await fetch(
  `${base}/rest/v1/campaign_tasks?select=id,kol_profiles!inner(slug,x_handle)&kol_profiles.slug=eq.${slug}`,
  { headers, signal: AbortSignal.timeout(20000) },
);
if (!lookup.ok) throw Error(`Task lookup failed with HTTP ${lookup.status}`);
const tasks = await lookup.json();
if (tasks.length !== 1) throw Error(`Expected one task, found ${tasks.length}`);
const task = tasks[0],
  raw = randomBytes(32).toString("base64url"),
  hash = createHash("sha256").update(raw).digest("hex"),
  expiresAt = new Date(Date.now() + 30 * 86400000).toISOString();
await writeFile(
  output,
  JSON.stringify(
    {
      generated_at: new Date().toISOString(),
      slug: task.kol_profiles.slug,
      handle: task.kol_profiles.x_handle,
      token: raw,
    },
    null,
    2,
  ),
  { mode: 0o600, flag: "wx" },
);
await chmod(output, 0o600);
try {
  const insert = await fetch(`${base}/rest/v1/rpc/rotate_task_token_hash`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      p_task_id: task.id,
      p_new_hash: hash,
      p_expires_at: expiresAt,
    }),
    signal: AbortSignal.timeout(20000),
  });
  if (!insert.ok)
    throw Error(`Atomic token rotation failed with HTTP ${insert.status}`);
} catch (error) {
  await unlink(output).catch(() => {});
  throw error;
}
console.log(
  JSON.stringify({
    status: "ok",
    slug: task.kol_profiles.slug,
    old_tokens_revoked: true,
    output_written: true,
  }),
);
