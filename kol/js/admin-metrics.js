export function metricMode(history = [], source = "") {
  const markedMock = history.some(
    (snapshot) =>
      snapshot?.mock === true ||
      snapshot?.payload?.mock === true ||
      snapshot?.raw_payload?.mock === true ||
      String(snapshot?.source || "").toLowerCase() === "mock",
  );
  if (markedMock || String(source).toLowerCase() === "mock") return "mock";
  const normalizedSource = String(source).toLowerCase();
  if (normalizedSource && !["waiting", "none", "manual_review", "—"].includes(normalizedSource)) return "live";
  return "waiting";
}

export function providerFailed(history = []) {
  return history.some((snapshot) =>
    ["manual_review", "provider_error", "failed"].includes(snapshot?.status),
  );
}

const FAILURE_STATUSES = new Set(["manual_review", "provider_error", "failed"]);
const newest = (snapshots) => snapshots.sort((a, b) => new Date(b.captured_at || 0) - new Date(a.captured_at || 0))[0] || null;
const successful = (snapshot) =>
  snapshot &&
  !FAILURE_STATUSES.has(snapshot.status) &&
  !["none", "manual_review"].includes(String(snapshot.source || "").toLowerCase());

export function selectWindowSnapshot(history = [], primaryType, retryTypes = []) {
  const primary = newest(history.filter((snapshot) => snapshot.snapshot_type === primaryType && successful(snapshot)));
  if (primary) return primary;
  return newest(history.filter((snapshot) => retryTypes.includes(snapshot.snapshot_type) && successful(snapshot)));
}

export function resolveMetricWindows(history = []) {
  const h24Types = ["24h", "30h_retry", "48h_retry"];
  const d7Types = ["7d", "8d_retry"];
  const h24 = selectWindowSnapshot(history, "24h", h24Types.slice(1));
  const d7 = selectWindowSnapshot(history, "7d", d7Types.slice(1));
  const failedFor = (types, selected) =>
    !selected && history.some((snapshot) => types.includes(snapshot.snapshot_type) && !successful(snapshot));
  return {
    h24,
    d7,
    h24Failed: failedFor(h24Types, h24),
    d7Failed: failedFor(d7Types, d7),
  };
}

export function officialMetricValue(metrics, key) {
  return metrics?.mode === "live" && Number.isFinite(metrics?.[key]) ? metrics[key] : null;
}

export function displayMetric(metrics, key, unableLabel) {
  if (metrics?.failed?.[key]) return unableLabel;
  return Number.isFinite(metrics?.[key]) ? metrics[key] : "—";
}
