export function deriveCampaignUrl(
  base: string,
  campaign: string,
  content: string,
) {
  let u: URL;
  try {
    u = new URL(base);
  } catch {
    return null;
  }
  if (!["http:", "https:"].includes(u.protocol)) return null;
  u.searchParams.set("utm_source", "x");
  u.searchParams.set("utm_medium", "kol");
  u.searchParams.set("utm_campaign", campaign.trim().slice(0, 100));
  u.searchParams.set("utm_content", content.trim().slice(0, 100));
  return u.toString().slice(0, 2048);
}
