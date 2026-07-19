import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";
import { validateAsset } from "../../supabase/functions/_shared/asset-validation.ts";
import { canAccessTaskContent } from "../../supabase/functions/_shared/task-visibility.ts";
import { deriveCampaignUrl } from "../../supabase/functions/_shared/campaign-url.ts";
const read = (p) => readFile(new URL(`../${p}`, import.meta.url), "utf8"),
  admin = await read("js/content-manager.js"),
  task = await read("js/task.js"),
  app = await read("css/app.css"),
  migration = await read("../supabase/migrations/002_kol_content_manager.sql"),
  fn = await read("../supabase/functions/admin-content/index.ts"),
  html = await read("admin.html");
assert.match(html, /Task content manager/);
assert.match(admin, /image\/png/);
assert.match(admin, /video\/mp4/);
assert.match(admin, /5242880/);
assert.match(admin, /18874368/);
assert.match(admin, /File signature/);
assert.equal(
  validateAsset("image/png", 4, new Uint8Array([0x89, 0x50, 0x4e, 0x47])).rule
    .type,
  "image",
);
assert.equal(
  validateAsset("image/png", 5242881, new Uint8Array([0x89, 0x50, 0x4e, 0x47]))
    .error,
  "Image exceeds 5 MB",
);
assert.equal(
  validateAsset("image/png", 4, new Uint8Array([0, 0, 0, 0])).error,
  "File signature does not match MIME type",
);
assert.equal(
  validateAsset("application/zip", 4, new Uint8Array(4)).error,
  "Unsupported file type",
);
assert.equal(
  validateAsset(
    "video/mp4",
    18874369,
    new Uint8Array([0, 0, 0, 0, 0x66, 0x74, 0x79, 0x70]),
  ).error,
  "Video exceeds 18 MB",
);
assert.equal(canAccessTaskContent("Ready to Publish"), true);
assert.equal(canAccessTaskContent("Published"), true);
for (const status of ["draft", "paused", "archived"])
  assert.equal(canAccessTaskContent(status), false);
assert.equal(deriveCampaignUrl("javascript:alert(1)", "a", "b"), null);
assert.equal(deriveCampaignUrl("data:text/plain,x", "a", "b"), null);
const safe = deriveCampaignUrl("https://magne.ai/path", "wave 1", "dragon");
assert.match(safe, /^https:\/\/magne\.ai/);
assert.match(safe, /utm_source=x/);
assert.match(fn, /at most 10 active assets/);
assert.match(fn, /task_content_saved/);
assert.match(fn, /asset_uploaded/);
assert.match(fn, /storage_upload/);
assert.match(fn, /Replacement failed/);
assert.match(fn, /reactivate|active: true/);
assert.match(migration, /public=false/);
assert.match(migration, /is_portal_admin/);
assert.match(migration, /kol_assets_admin_insert/);
assert.match(migration, /rotate_task_token_hash/);
assert.match(
  migration,
  /grant execute on function public\.rotate_task_token_hash\(uuid,text,timestamptz\) to service_role/,
);
assert.doesNotMatch(
  migration,
  /create policy kol_assets_admin_(insert|update|delete)/,
);
assert.doesNotMatch(migration, /create policy admin_(tasks|assets)_write/);
assert.match(fn, /compensation_failed/);
assert.match(fn, /outcome: "failed"/);
assert.match(fn, /outcome: "completed"/);
assert.match(fn, /asset_delete_requested/);
for (const policy of [
  "staff_tasks_read",
  "admin_tasks_write",
  "staff_assets_read",
  "admin_assets_write",
])
  assert.match(migration, new RegExp(`drop policy if exists ${policy}`));
assert.match(task, /campaignCard.*hidden/s);
assert.match(app, /overflow-wrap:\s*anywhere/);
assert.match(app, /max-width:\s*375px/);
console.log("content manager security and behavior tests: PASS");
