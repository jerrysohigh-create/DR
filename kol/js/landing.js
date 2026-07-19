export const TEST_KOLS = Object.freeze([
  { slug: "crypto-dragon", handle: "CryptoDragon001" },
  { slug: "kryptomonach", handle: "Kryptomonach" },
  { slug: "crypto-panda", handle: "CryptoPanda_gl" },
]);
export function validateLandingInput(slug, token) {
  if (!TEST_KOLS.some((k) => k.slug === slug))
    return "Select your assigned KOL account.";
  if (!String(token || "").trim()) return "Enter your private task token.";
  return "";
}
export function taskTokenKey(slug) {
  if (!TEST_KOLS.some((k) => k.slug === slug))
    throw new Error("Select your assigned KOL account.");
  return `kol_token_${slug}`;
}
export function storeTaskToken(storage, slug, token) {
  const error = validateLandingInput(slug, token);
  if (error) throw new Error(error);
  storage.setItem(taskTokenKey(slug), String(token).trim());
}
export function buildTaskUrl(base, slug) {
  taskTokenKey(slug);
  const url = new URL(base);
  url.search = "";
  url.hash = "";
  url.searchParams.set("task", slug);
  return url.href;
}
export function showLanding() {
  const state = document.querySelector("#state"),
    landing = document.querySelector("#landing"),
    form = document.querySelector("#taskAccess"),
    message = document.querySelector("#landingMsg");
  state.classList.add("hidden");
  landing.classList.remove("hidden");
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(form),
      slug = data.get("task"),
      token = data.get("token"),
      error = validateLandingInput(slug, token);
    message.textContent = error;
    if (!error) {
      storeTaskToken(sessionStorage, slug, token);
      form.elements.token.value = "";
      location.assign(buildTaskUrl(location.href, slug));
    }
  });
}
