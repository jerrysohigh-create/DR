import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { safeImageAssets, safeImageUrl } from "../js/asset-url.js";

const BASE = "https://jerrysohigh-create.github.io/magne-web/kol/index.html";

// ============ 1. Valid official image URLs must pass ============
const validUrls = [
  ["assets/wave-1/demo-primary.svg", "relative SVG"],
  ["https://jerrysohigh-create.github.io/magne-web/phone.png", "GH Pages PNG"],
  ["https://www.magne.ai/magne-web/phone-black.png", "www.magne.ai PNG"],
  ["https://magne.ai/a.png", "apex magne.ai PNG"],
  ["https://www.magne.ai/a.jpg", "JPG"],
  ["https://www.magne.ai/a.jpeg", "JPEG"],
  ["https://www.magne.ai/a.webp", "WebP"],
  ["https://www.magne.ai/a.svg", "SVG"],
  ["https://olgvhiwkcjkbqwawgiaq.supabase.co/storage/v1/object/sign/kol-assets/a.png?token=***", "signed Supabase PNG"],
];
for (const [url, label] of validUrls) {
  const result = safeImageUrl(url, BASE);
  assert.ok(result, `valid URL must pass (${label}): ${url}`);
}
assert.ok(safeImageUrl("assets/wave-1/demo-primary.svg", "http://127.0.0.1:8765/kol/"),
  "relative URL with http localhost base must pass (same-origin)");

// ============ 2. Dangerous URLs must be rejected ============
const dangerous = [
  ["javascript:alert(1)", "javascript scheme"],
  ["data:text/html,test", "data scheme"],
  ["blob:https://magne.ai/id", "blob scheme"],
  ["http://www.magne.ai/a.png", "http scheme (non-same-origin)"],
  ["//evil.example/a.png", "protocol-relative"],
  ["https://evil.example/a.png", "non-allowlisted host"],
  ["https://www.magne.ai.evil.example/a.png", "suffix attack on allowlisted host"],
  ["https://user:pass@www.magne.ai/a.png", "userinfo in URL"],
  ["https://www.magne.ai:444/a.png", "non-standard port"],
  ["https://www.magne.ai/%0aevil.png", "encoded control char in path"],
  ["https://www.magne.ai/\u0000evil.png", "raw control char in path"],
  ["https://youtube.com/shorts/ZMhyf6yImOc", "youtube shorts"],
  ["https://www.youtube.com/watch?v=abc", "youtube watch"],
  ["https://youtube-nocookie.com/embed/abc", "youtube nocookie"],
  ["https://i.ytimg.com/vi/abc/hqdefault.jpg", "youtube thumbnail host"],
  ["ftp://www.magne.ai/a.png", "ftp scheme"],
  ["file:///etc/passwd", "file scheme"],
  ["https://www.magne.ai/a.exe", "non-image extension"],
  ["https://www.magne.ai/a", "no extension"],
];
for (const [url, label] of dangerous) {
  const result = safeImageUrl(url, BASE);
  assert.equal(result, null, `must reject (${label}): ${url}`);
}

// ============ 3. safeImageAssets must filter mixed input ============
const mixedAssets = [
  { type: "image", url: "https://www.magne.ai/a.png", name: "valid-official" },
  { type: "image", url: "https://jerrysohigh-create.github.io/magne-web/a.png", name: "valid-gh-pages" },
  { type: "image", url: "javascript:alert(1)", name: "invalid-js" },
  { type: "image", url: "data:text/html,x", name: "invalid-data" },
  { type: "image", url: "http://www.magne.ai/a.png", name: "invalid-http" },
  { type: "image", url: "https://evil.example/a.png", name: "invalid-host" },
  { type: "image", url: "https://www.magne.ai/a.exe", name: "invalid-extension" },
  { type: "video", url: "https://youtube.com/shorts/abc", name: "youtube-video" },
  { type: "iframe", url: "https://www.youtube.com/embed/abc", name: "youtube-iframe" },
];
const filtered = safeImageAssets(mixedAssets, BASE);
assert.equal(filtered.length, 2, `expected 2 valid assets, got ${filtered.length}: ${JSON.stringify(filtered.map((a) => a.name))}`);
assert.equal(filtered[0].name, "valid-official");
assert.equal(filtered[1].name, "valid-gh-pages");
for (const a of filtered) {
  assert.equal(a.type, "image", "all survivors must be image type");
  assert.ok(
    a.url.startsWith("https://") || a.url.startsWith("assets/") || a.url.startsWith("./") || a.url.startsWith("/"),
    `URL must use safe scheme or relative form: ${a.url}`,
  );
}

// ============ 4. safeImageAssets edge cases ============
assert.deepEqual(safeImageAssets([], BASE), [], "empty array → empty");
assert.deepEqual(safeImageAssets(null, BASE), [], "null → empty");
assert.deepEqual(safeImageAssets(undefined, BASE), [], "undefined → empty");
assert.deepEqual(safeImageAssets("not-array", BASE), [], "non-array → empty");
const onlyVideo = safeImageAssets([{ type: "video", url: "https://www.magne.ai/a.png", name: "x" }], BASE);
assert.deepEqual(onlyVideo, [], "video type must be filtered even if URL passes");

// ============ 5. task.js structural integrity (no DOM, source only) ============
const taskJs = await readFile(new URL("../js/task.js", import.meta.url), "utf8");

// 5a. Download All handler must iterate renderedDownloadableAssets (validated set)
assert.match(
  taskJs,
  /onclick\s*=\s*\(\)\s*=>\s*renderedDownloadableAssets\.forEach/,
  "Download All handler must iterate renderedDownloadableAssets",
);

// 5b. task.assets.forEach must NOT appear (raw iteration would bypass validation)
const rawForEach = [...taskJs.matchAll(/task\.assets\.forEach\s*\(/g)];
assert.equal(rawForEach.length, 0, `task.assets.forEach must not exist; found ${rawForEach.length} occurrence(s)`);

// 5c. No createElement for video or iframe (would enable YouTube/video rendering)
assert.doesNotMatch(taskJs, /createElement\s*\(\s*['"]video/, "no createElement('video') allowed");
assert.doesNotMatch(taskJs, /createElement\s*\(\s*['"]iframe/, "no createElement('iframe') allowed");

// 5d. renderAssets + downloadableAssets must be exported
assert.match(taskJs, /export\s+function\s+renderAssets/, "renderAssets must be exported");
assert.match(taskJs, /export\s+function\s+downloadableAssets/, "downloadableAssets must be exported");

// 5e. renderAssets must call safeImageAssets (so the JS validator is the single source of truth)
assert.match(taskJs, /safeImageAssets\s*\(/, "renderAssets must call safeImageAssets");

// 5f. No download="" attribute on asset links (cross-origin can't force download)
assert.doesNotMatch(taskJs, /\.download\s*=\s*["']["']/, "no download='' attribute allowed (cross-origin unsafe)");

// 5g. Anchor tags must use rel="noopener noreferrer"
assert.ok(taskJs.includes("noopener noreferrer"), 'anchor tags must include rel="noopener noreferrer"');

// ============ 6. TS validator source vs JS validator allowlist equivalence ============
const tsSource = await readFile(
  new URL("../../supabase/functions/_shared/public-asset-url.ts", import.meta.url),
  "utf8",
);
const jsSource = await readFile(
  new URL("../js/asset-url.js", import.meta.url),
  "utf8",
);

function extractHosts(src) {
  // /i flag covers both `ALLOWED_HOSTS` (JS) and `allowedHosts` (TS)
  const m = src.match(/(?:allowed|ALLOWED)?hosts?\s*=\s*new\s+Set\s*\(\s*\[\s*([^\]]+?)\s*\]\s*\)/i);
  if (!m) return null;
  return [...m[1].matchAll(/["']([^"']+)["']/g)].map((x) => x[1]).sort();
}
const jsHosts = extractHosts(jsSource);
const tsHosts = extractHosts(tsSource);
assert.ok(jsHosts && jsHosts.length > 0, `JS allowlist must be present and non-empty (got ${JSON.stringify(jsHosts)})`);
assert.ok(tsHosts && tsHosts.length > 0, `TS allowlist must be present and non-empty (got ${JSON.stringify(tsHosts)})`);
assert.deepEqual(
  tsHosts,
  jsHosts,
  `TS allowlist must equal JS allowlist: TS=${JSON.stringify(tsHosts)} JS=${JSON.stringify(jsHosts)}`,
);
assert.deepEqual(
  jsHosts,
  ["jerrysohigh-create.github.io", "magne.ai", "olgvhiwkcjkbqwawgiaq.supabase.co", "www.magne.ai"],
  "JS allowlist must contain exactly the four approved hosts",
);

const requiredTsChecks = [
  ["control chars", /controls?\.test\s*\(/],
  ["encoded controls", /encodedControls?\.test\s*\(/],
  ["protocol-relative reject", /startsWith\s*\(\s*["']\/\/["']\s*\)/],
  ["username reject", /url\.username/],
  ["password reject", /url\.password/],
  ["port reject", /url\.port/],
  ["https protocol check", /protocol\s*[!=]==?\s*["']https:/],
  ["extension check", /\.endsWith\s*\(\s*extension/],
];
for (const [name, regex] of requiredTsChecks) {
  assert.match(tsSource, regex, `TS validator must include check: ${name}`);
}

// ============ 7. Edge function filter + safe URL wiring ============
const edgeFn = await readFile(
  new URL("../../supabase/functions/get-task/index.ts", import.meta.url),
  "utf8",
);
assert.match(edgeFn, /active\s*&&\s*x\.asset_type\s*===\s*["']image["']/, "edge function must filter image type only");
assert.match(edgeFn, /safePublicImageUrl\s*\(/, "edge function must use safePublicImageUrl");
assert.match(edgeFn, /compareTaskAssets\s*\)/, "edge function must use compareTaskAssets for stable sort");

// ============ 8. HTML CSP sanity ============
const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
assert.match(html, /Content-Security-Policy/, "CSP meta tag must exist");
assert.match(html, /default-src\s+'self'/, "default-src must be 'self'");
assert.doesNotMatch(html, /youtube(?:-nocookie)?\.com/, "no YouTube domain in CSP");
assert.match(html, /frame-ancestors\s+'none'/, "frame-ancestors 'none' must be set");
assert.match(
  html,
  /frame-ancestors in a meta CSP is not enforced/i,
  "frame-ancestors limitation via meta must be documented in HTML",
);

// ============ 9. CSS mobile layout ============
const css = await readFile(new URL("../css/app.css", import.meta.url), "utf8");
assert.match(css, /@media\s*\(\s*max-width:\s*375px\s*\)/, "375px media query must exist");
assert.match(css, /\.asset\s*\{\s*grid-template-columns:\s*72px\s+minmax/, "mobile asset grid must be defined");

console.log("asset-safety-tests: PASS");
