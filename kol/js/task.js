import { parseXPostUrl, sameHandle } from "./validation.js";
import { api, isDemo } from "./supabase-client.js";
import { showLanding } from "./landing.js";
import { getLanguage, setupLanguageSwitcher, t } from "./i18n.js";
import { safeImageAssets } from "./asset-url.js";
setupLanguageSwitcher();
const $ = (s) => document.querySelector(s);
document.addEventListener("kol:language", () => location.reload());
let task,
  sessionToken = "",
  renderedDownloadableAssets = [];
export function downloadableAssets(assets) {
  return safeImageAssets(assets);
}
export function renderAssets(assets, container = $("#assets"), card = $("#assetsCard")) {
  const safeAssets = downloadableAssets(assets);
  renderedDownloadableAssets = safeAssets;
  container.replaceChildren();
  card.classList.toggle("hidden", !safeAssets.length);
  safeAssets.forEach((a) => {
    const row = document.createElement("div");
    row.className = "asset";
    const media = document.createElement("img");
    media.src = a.url;
    media.alt = a.name || "Campaign asset";
    media.addEventListener("error", () => {
      row.remove();
      if (!container.children.length) card.classList.add("hidden");
    }, { once: true });
    const name = document.createElement("span");
    name.textContent = a.name;
    const dl = document.createElement("a");
    dl.className = "button secondary";
    dl.href = a.url;
    dl.target = "_blank";
    dl.rel = "noopener noreferrer";
    dl.textContent = "Open / Download Asset";
    row.append(media, name, dl);
    container.append(row);
  });
  return safeAssets;
}
function fail(m) {
  ($("#state").innerHTML =
    `<strong>${t("unavailable")}</strong><p class="error"></p>`),
    ($("#state").querySelector("p").textContent = m);
}
const safeError = (value) => t("errorPrefix", { detail: String(value || t("unknownError")) });
async function copy(v, msg) {
  await navigator.clipboard.writeText(v),
    ($(msg).textContent = t("copied")),
    setTimeout(() => ($(msg).textContent = ""), 1800);
}
($("#copyPost").onclick = () => copy(task.copy, "#copyMsg")),
  ($("#copyLink").onclick = () => copy(task.utm, "#copyMsg")),
  ($("#downloadAll").onclick = () =>
    renderedDownloadableAssets.forEach((a, i) =>
      setTimeout(() => {
        const x = document.createElement("a");
        (x.href = a.url), (x.target = "_blank"), (x.rel = "noopener noreferrer"), x.click();
      }, 300 * i),
    )),
  ($("#calendar").onclick = () => {
    const d = new Date(task.publishAt);
    var x;
    location.href = `data:text/calendar;charset=utf-8,${encodeURIComponent(
      `BEGIN:VCALENDAR\nBEGIN:VEVENT\nDTSTART:${
        ((x = d),
        x
          .toISOString()
          .replace(/[-:]/g, "")
          .replace(/\.\d{3}/, ""))
      }\nSUMMARY:MAGNE.AI X post - ${task.handle}\nEND:VEVENT\nEND:VCALENDAR`,
    )}`;
  }),
  ($("#submit").onclick = async () => {
    const m = $("#submitMsg"),
      parsed = parseXPostUrl($("#postUrl").value);
    if (((m.className = "error"), !parsed))
      return (m.textContent =
        t("invalidPost"));
    if (!sameHandle(parsed.username, task.handle))
      return (m.textContent = t("wrongHandle", { user: parsed.username, handle: task.handle }));
    const key = `kol_submission_${task.slug}`;
    if (localStorage.getItem(key))
      return (m.textContent =
        t("submitted"));
    if (confirm(t("confirmSubmit", { url: parsed.url })))
      try {
        const result = isDemo
          ? { submittedAt: new Date().toISOString() }
          : await api.submitPost(task.slug, parsed.url, sessionToken);
        localStorage.setItem(
          key,
          JSON.stringify({
            task: task.slug,
            url: parsed.url,
            handle: parsed.username,
            postId: parsed.postId,
            submittedAt: result.submittedAt || new Date().toISOString(),
          }),
        ),
          (m.textContent = ""),
          $("#receipt").classList.remove("hidden"),
          ($("#receiptData").textContent =
            `${parsed.url} · ${new Date(result.submittedAt || Date.now()).toLocaleString()}`);
      } catch (e) {
        m.textContent = safeError(e.message);
      }
  }),
  (async function () {
    const p = new URLSearchParams(location.search),
      slug = p.get("task"),
      token = p.get("token");
    if (!slug && !token) return showLanding();
    if (
      ((sessionToken =
        token || sessionStorage.getItem(`kol_token_${slug}`) || ""),
      token &&
        (sessionStorage.setItem(`kol_token_${slug}`, token),
        p.delete("token"),
        history.replaceState(
          {},
          "",
          `${location.pathname}${p.size ? "?" + p : ""}${location.hash}`,
        )),
      !slug || !sessionToken)
    )
      return fail(t("incomplete"));
    try {
      if (isDemo) {
        const d = await fetch("assets/mock/demo-task.json").then((r) =>
          r.json(),
        );
        if (
          ((task = d.tasks.find(
            (x) => x.slug === slug && x.token === sessionToken,
          )),
          !task)
        )
          throw Error("Invalid, expired or revoked demo link.");
      } else task = await api.getTask(slug, sessionToken);
      !(function renderTask() {
        ($(".demo").textContent = "DEMO"),
          $("#state").classList.add("hidden"),
          $("#app").classList.remove("hidden"),
          ($("#handle").textContent = task.handle),
          ($("#wave").textContent = task.wave),
          ($("#status").textContent = task.status),
          ($("#copy").textContent = task.copy),
          ($("#utm").textContent = task.utm || ""),
          ($("#openLink").href = task.utm || ""),
          $("#campaignCard").classList.toggle("hidden", !task.utm);
        const d = new Date(task.publishAt);
        const locale = getLanguage() === "tc" ? "zh-Hant-TW" : "en-SG";
        ($("#publish").textContent =
          `${new Intl.DateTimeFormat(locale, { dateStyle: "full", timeStyle: "short", timeZone: "Asia/Singapore" }).format(d)} SGT`),
          ($("#local").textContent =
            t("localTime", { value: new Intl.DateTimeFormat(locale, { dateStyle: "full", timeStyle: "short" }).format(d) })),
          setInterval(() => {
            const n = d - Date.now();
            $("#countdown").textContent =
              n > 0
                ? t("publishes", { d: Math.floor(n / 864e5), h: Math.floor((n % 864e5) / 36e5), m: Math.floor((n % 36e5) / 6e4) })
                : t("windowOpen");
          }, 1e3),
          task.requirements.slice(0, 3).forEach((x) => {
            const li = document.createElement("li");
            (li.textContent = x), $("#requirements").append(li);
          }),
          ($("#prohibited").textContent = task.prohibited || ""),
          renderAssets(task.assets);
      })();
    } catch (e) {
      fail(safeError(e.message));
    }
  })();
