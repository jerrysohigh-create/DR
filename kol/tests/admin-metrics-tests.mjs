import assert from "node:assert/strict";
import { displayMetric, metricMode, officialMetricValue, providerFailed, resolveMetricWindows } from "../js/admin-metrics.js";

const mock = { mode: "mock", d7: 900, h24: 300, providerFailed: false };
const live = { mode: "live", d7: 800, h24: 200, providerFailed: false };
const failed = { mode: "waiting", d7: 0, providerFailed: true, failed: { d7: true } };

assert.equal(metricMode([{ source: "apify", payload: { mock: true } }], "apify"), "mock");
assert.equal(metricMode([{ source: "provider-a" }], "provider-a"), "live");
assert.equal(providerFailed([{ status: "manual_review" }]), true);
assert.equal(metricMode([{ snapshot_type: "24h", source: "none", status: "manual_review" }], "none"), "waiting");
assert.equal(officialMetricValue(mock, "d7"), null);
assert.equal(officialMetricValue(live, "d7"), 800);
assert.equal(displayMetric(failed, "d7", "Unable to Verify"), "Unable to Verify");
assert.equal(displayMetric({ d7: null, providerFailed: false }, "d7", "Unable to Verify"), "—");

const windows = resolveMetricWindows([
  { snapshot_type: "24h", source: "live", status: "ok", views: 100, captured_at: "2026-07-20T00:00:00Z" },
  { snapshot_type: "30h_retry", source: "live", status: "ok", views: 200, captured_at: "2026-07-21T00:00:00Z" },
  { snapshot_type: "7d", source: "none", status: "manual_review", views: 0, captured_at: "2026-07-27T00:00:00Z" },
  { snapshot_type: "8d_retry", source: "live", status: "ok", views: 800, captured_at: "2026-07-28T00:00:00Z" },
]);
assert.equal(windows.h24.views, 100, "successful 24h takes priority over retries");
assert.equal(windows.d7.views, 800, "8d retry replaces a failed 7d snapshot");
assert.equal(windows.d7Failed, false);

const retryOnly = resolveMetricWindows([
  { snapshot_type: "30h_retry", source: "live", status: "ok", views: 300, captured_at: "2026-07-20T00:00:00Z" },
  { snapshot_type: "48h_retry", source: "live", status: "ok", views: 480, captured_at: "2026-07-21T00:00:00Z" },
]);
assert.equal(retryOnly.h24.views, 480, "latest valid retry is used when 24h is absent");

const unresolved = resolveMetricWindows([
  { snapshot_type: "7d", source: "none", status: "manual_review", views: 0 },
]);
assert.equal(unresolved.d7, null);
assert.equal(unresolved.d7Failed, true);

console.log("admin metrics tests: PASS");
