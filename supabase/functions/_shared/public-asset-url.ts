const allowedHosts = new Set([
  "jerrysohigh-create.github.io",
  "www.magne.ai",
  "magne.ai",
  "olgvhiwkcjkbqwawgiaq.supabase.co",
]);
const allowedExtensions = [".png", ".jpg", ".jpeg", ".webp", ".svg"];
const controls = /[\u0000-\u001f\u007f]/;
const encodedControls = /%(?:0[0-9a-f]|1[0-9a-f]|7f)/i;

export function safePublicImageUrl(value: unknown) {
  if (typeof value !== "string" || !value || controls.test(value) || encodedControls.test(value) || value.startsWith("//")) return null;
  try {
    let absolute = true;
    try { new URL(value); } catch { absolute = false; }
    const url = new URL(value, "https://jerrysohigh-create.github.io/magne-web/kol/");
    if (url.protocol !== "https:" || url.username || url.password || url.port) return null;
    if (absolute && !allowedHosts.has(url.hostname.toLowerCase())) return null;
    if (!absolute && url.origin !== "https://jerrysohigh-create.github.io") return null;
    if (!allowedExtensions.some((extension) => url.pathname.toLowerCase().endsWith(extension))) return null;
    return absolute ? url.href : value;
  } catch {
    return null;
  }
}

export function compareTaskAssets(a: Record<string, unknown>, b: Record<string, unknown>) {
  return (Number(a.sort_order) - Number(b.sort_order)) ||
    String(a.created_at || "").localeCompare(String(b.created_at || "")) ||
    String(a.id).localeCompare(String(b.id));
}
