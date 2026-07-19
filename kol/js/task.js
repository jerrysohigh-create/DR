import { parseXPostUrl, sameHandle } from "./validation.js";
import { api, isDemo } from "./supabase-client.js";
import { showLanding } from "./landing.js";
const $ = (s) => document.querySelector(s);
let task,
  sessionToken = "";
function fail(m) {
  ($("#state").innerHTML =
    '<strong>Task unavailable</strong><p class="error"></p>'),
    ($("#state").querySelector("p").textContent = m);
}
async function copy(v, msg) {
  await navigator.clipboard.writeText(v),
    ($(msg).textContent = "Copied."),
    setTimeout(() => ($(msg).textContent = ""), 1800);
}
($("#copyPost").onclick = () => copy(task.copy, "#copyMsg")),
  ($("#copyLink").onclick = () => copy(task.utm, "#copyMsg")),
  ($("#downloadAll").onclick = () =>
    task.assets.forEach((a, i) =>
      setTimeout(() => {
        const x = document.createElement("a");
        (x.href = a.url), (x.download = ""), x.click();
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
        "Enter a valid x.com or twitter.com post URL containing /status/ and a numeric Post ID.");
    if (!sameHandle(parsed.username, task.handle))
      return (m.textContent = `This post belongs to @${parsed.username}, not ${task.handle}.`);
    const key = `kol_submission_${task.slug}`;
    if (localStorage.getItem(key))
      return (m.textContent =
        "A post has already been submitted for this task.");
    if (confirm(`Submit ${parsed.url}? This cannot be changed.`))
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
        m.textContent = e.message;
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
      return fail("This task link is incomplete or invalid.");
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
      !(function () {
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
        ($("#publish").textContent =
          `${new Intl.DateTimeFormat("en-SG", { dateStyle: "full", timeStyle: "short", timeZone: "Asia/Singapore" }).format(d)} SGT`),
          ($("#local").textContent =
            `Your local time: ${new Intl.DateTimeFormat(void 0, { dateStyle: "full", timeStyle: "short" }).format(d)}`),
          setInterval(() => {
            const n = d - Date.now();
            $("#countdown").textContent =
              n > 0
                ? `Publishes in ${Math.floor(n / 864e5)}d ${Math.floor((n % 864e5) / 36e5)}h ${Math.floor((n % 36e5) / 6e4)}m`
                : "Publishing window is open";
          }, 1e3),
          task.requirements.slice(0, 3).forEach((x) => {
            const li = document.createElement("li");
            (li.textContent = x), $("#requirements").append(li);
          }),
          ($("#prohibited").textContent = task.prohibited || ""),
          (function () {
            if (!task.assets?.length)
              return void $("#assetsCard").classList.add("hidden");
            task.assets.forEach((a) => {
              const row = document.createElement("div");
              row.className = "asset";
              const media = document.createElement(
                "video" === a.type ? "video" : "img",
              );
              (media.src = a.url), "video" === a.type && (media.controls = !0);
              const name = document.createElement("span");
              name.textContent = a.name;
              const dl = document.createElement("a");
              (dl.className = "button secondary"),
                (dl.href = a.url),
                (dl.download = ""),
                (dl.textContent = "Download"),
                row.append(media, name, dl),
                $("#assets").append(row);
            });
          })();
      })();
    } catch (e) {
      fail(e.message);
    }
  })();
