const ALLOWED_HOSTS = new Set([
  "jerrysohigh-create.github.io",
  "www.magne.ai",
  "magne.ai",
  "olgvhiwkcjkbqwawgiaq.supabase.co",
]);
const IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp", ".svg"]);
const CONTROL_CHARACTERS = /[\u0000-\u001f\u007f]/;
const ENCODED_CONTROL_CHARACTERS = /%(?:0[0-9a-f]|1[0-9a-f]|7f)/i;

export function safeImageUrl(value, base = globalThis.location?.href) {
  if (typeof value !== "string" || !value || CONTROL_CHARACTERS.test(value) || ENCODED_CONTROL_CHARACTERS.test(value)) return null;
  if (value.startsWith("//")) return null;
  const isRelative = /^(?:\.\.?\/|\/)?[^/:?#][^:]*$/.test(value);
  if (!base && isRelative) return null;
  try {
    const url = new URL(value, base);
    const baseUrl = base ? new URL(base) : null;
    const sameOrigin = isRelative && baseUrl && url.origin === baseUrl.origin;
    if (url.username || url.password || (!sameOrigin && url.port)) return null;
    if (sameOrigin ? !["http:", "https:"].includes(url.protocol) : url.protocol !== "https:") return null;
    if (!sameOrigin && !ALLOWED_HOSTS.has(url.hostname.toLowerCase())) return null;
    const pathname = url.pathname.toLowerCase();
    if (![...IMAGE_EXTENSIONS].some((ext) => pathname.endsWith(ext))) return null;
    return url.href;
  } catch {
    return null;
  }
}

export function safeImageAssets(assets, base = globalThis.location?.href) {
  if (!Array.isArray(assets)) return [];
  return assets.flatMap((asset) => {
    if (asset?.type !== "image") return [];
    const url = safeImageUrl(asset.url, base);
    return url ? [{ ...asset, url }] : [];
  });
}
