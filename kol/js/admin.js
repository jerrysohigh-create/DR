import { csvCell } from "./validation.js";
import { isDemo, config } from "./supabase-client.js";
import {
  inspectAuthCallback,
  resolveAuthEntry,
  consumeAuthCallback,
  isPasswordSetupEvent,
  completePasswordSetup,
} from "./admin-auth.js";
import { setupContentManager } from "./content-manager.js";
import { t } from "./i18n.js";
import { displayMetric, metricMode, officialMetricValue, resolveMetricWindows } from "./admin-metrics.js";
const $ = (s) => document.querySelector(s);
const safeError = (value, fallback = "unknownError") => t("errorPrefix", { detail: String(value || t(fallback)) });
const statusLabel = (value) => ({ draft: t("draft"), "Ready to Publish": t("ready"), Published: t("published"), paused: t("paused"), archived: t("archived") }[value] || value);
let tasks = [],
  supabase,
  session,
  settingPassword = false,
  contentReady = false;
let authCallback = inspectAuthCallback(location.href);
function normalize(rows) {
  return (rows || []).map((t) => {
    const sub = Array.isArray(t.post_submissions)
        ? t.post_submissions[0]
        : t.post_submissions,
      metrics = sub?.metric_snapshots || [],
      windows = resolveMetricWindows(metrics);
    return {
      id: t.id,
      slug: t.slug || t.kol_profiles?.slug || t.id,
      handle: t.handle || t.kol_profiles?.x_handle,
      name: t.name || t.kol_profiles?.display_name,
      wave: t.wave,
      publishAt: t.publishAt || t.publish_at,
      status: t.status,
      angle: t.angle || t.primary_angle,
      title: t.title,
      copy: t.copy || t.approved_copy,
      requirements: t.requirements || [],
      prohibited: t.prohibited_claims || [],
      campaignLinkEnabled: t.campaign_link_enabled,
      campaignBaseUrl: t.campaign_base_url,
      utm: t.utm_url,
      assets: (t.task_assets || []).map((a) => ({
        id: a.id,
        type: a.asset_type,
        name: a.file_name,
        storagePath: a.storage_path,
        previewUrl: a.preview_url,
        url: a.public_url,
        active: a.active,
        sortOrder: a.sort_order,
        sizeBytes: a.size_bytes,
        mimeType: a.mime_type,
      })),
      submission:
        t.submission ||
        (sub && { url: sub.submitted_url, submittedAt: sub.submitted_at }),
      metrics: metrics.length
        ? (() => {
          const effective = windows.d7 || windows.h24;
          const source = effective?.source ?? "Waiting";
          const failed = {
            h24: windows.h24Failed,
            d7: windows.d7Failed,
            likes: !effective && (windows.h24Failed || windows.d7Failed),
            replies: !effective && (windows.h24Failed || windows.d7Failed),
            reposts: !effective && (windows.h24Failed || windows.d7Failed),
          };
          return {
            h24: windows.h24?.views ?? null,
            d7: windows.d7?.views ?? null,
            likes: effective?.likes ?? null,
            replies: effective?.replies ?? null,
            reposts: effective?.reposts ?? null,
            source,
            mode: metricMode(metrics, source),
            providerFailed: Object.values(failed).some(Boolean),
            failed,
            history: metrics,
          };
        })()
        : t.metrics || {
            h24: null,
            d7: null,
            likes: null,
            replies: null,
            reposts: null,
            source: sub ? "Waiting" : "—",
            mode: "waiting",
            providerFailed: false,
            failed: {},
            history: [],
          },
    };
  });
}
async function signIn() {
  if (isDemo) {
    if ($("#password").value !== "demo-admin")
      return ($("#loginMsg").textContent = t("invalidCredentials"));
    sessionStorage.setItem("kol_demo_admin", "1");
    return loadDemo();
  }
  const result = await supabase.auth.signInWithPassword({
    email: $("#email").value.trim(),
    password: $("#password").value,
  });
  if (result.error) return ($("#loginMsg").textContent = safeError(result.error.message));
  session = result.data.session;
  await loadProduction();
}
async function init() {
  if (isDemo) {
    if (sessionStorage.getItem("kol_demo_admin")) await loadDemo();
    return;
  }
  const mod = await import("https://esm.sh/@supabase/supabase-js@2");
  supabase = mod.createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY);
  const { data, error } = await supabase.auth.getSession(),
    state = resolveAuthEntry({
      callback: authCallback,
      session: data.session,
      sessionError: error,
      cleanUrl: () => history.replaceState({}, "", location.pathname),
    });
  authCallback = consumeAuthCallback(authCallback);
  if (state === "error") showAuthLinkError();
  else if (state === "set-password") {
    session = data.session;
    showSetPassword();
  } else if (state === "signed-in") {
    session = data.session;
    await loadProduction();
  }
  supabase.auth.onAuthStateChange((event, s) => {
    session = s;
    if (isPasswordSetupEvent(event, authCallback, s)) showSetPassword();
    else if (!s && !settingPassword) showLogin();
  });
}
function hideAuthViews() {
  ["login", "setPassword", "authLinkError", "dashboard"].forEach((id) =>
    $("#" + id).classList.add("hidden"),
  );
}
function showSetPassword() {
  settingPassword = true;
  hideAuthViews();
  $("#setPassword").classList.remove("hidden");
  $("#newPassword").focus();
}
function showAuthLinkError() {
  settingPassword = false;
  hideAuthViews();
  $("#authLinkError").classList.remove("hidden");
}
async function savePassword(event) {
  event.preventDefault();
  const msg = $("#passwordMsg"),
    button = $("#savePassword");
  msg.textContent = "";
  button.disabled = true;
  const result = await completePasswordSetup({
    auth: supabase.auth,
    password: $("#newPassword").value,
    confirmation: $("#confirmPassword").value,
    email: session?.user?.email,
    cleanUrl: () => history.replaceState({}, "", location.pathname),
  });
  button.disabled = false;
  if (result.error) return (msg.textContent = safeError(result.error));
  settingPassword = false;
  showLogin();
  $("#loginMsg").textContent =
    t("passwordSuccess");
  $("#email").value = result.email || $("#email").value;
  $("#password").value = "";
  $("#password").focus();
}
async function loadDemo() {
  const d = await fetch("assets/mock/demo-task.json").then((r) => r.json());
  tasks = normalize(
    d.tasks.map((t) => {
      const s = JSON.parse(
        localStorage.getItem(`kol_submission_${t.slug}`) || "null",
      );
      return { ...t, submission: s, status: s ? "Published" : t.status };
    }),
  );
  show();
}
async function loadProduction() {
  try {
    await fetchProduction();
    show();
    if (!contentReady) {
      setupContentManager({
        supabase,
        getSession: () => session,
        getTasks: () => tasks,
        reload: fetchProduction,
      });
      contentReady = true;
    }
  } catch (e) {
    $("#loginMsg").textContent = safeError(e.message);
    await supabase.auth.signOut();
  }
}
async function fetchProduction() {
  const r = await fetch(`${config.SUPABASE_URL}/functions/v1/admin-export`, {
      headers: {
        apikey: config.SUPABASE_ANON_KEY,
        authorization: `Bearer ${session.access_token}`,
      },
    }),
    d = await r.json();
  if (!r.ok) throw Error(d.error || t("adminDenied"));
  tasks = normalize(d.rows);
}
function show() {
  hideAuthViews();
  $("#dashboard").classList.remove("hidden");
  render();
}
function showLogin() {
  hideAuthViews();
  $("#login").classList.remove("hidden");
}
function render() {
  const now = Date.now(),
    q = $("#search").value.toLowerCase(),
    wave = $("#wave").value,
    status = $("#filterStatus").value,
    shown = tasks.filter(
      (t) =>
        (t.handle + t.name).toLowerCase().includes(q) &&
        (!wave || t.wave === wave) &&
        (!status || t.status === status),
    ),
    published = tasks.filter((t) => t.submission).length,
    overdue = tasks.filter(
      (t) => !t.submission && new Date(t.publishAt) < now,
    ).length,
    done = (k) => tasks.filter((t) => t.metrics[k] != null).length,
    views = tasks.reduce((n, task) => n + (officialMetricValue(task.metrics, "d7") ?? officialMetricValue(task.metrics, "h24") ?? 0), 0),
    eng = tasks.reduce(
      (n, t) =>
        n +
        (t.metrics.likes ?? 0) +
        (t.metrics.replies ?? 0) +
        (t.metrics.reposts ?? 0),
      0,
    ),
    review = tasks.filter(
      (t) =>
        t.metrics.source === "none" || t.metrics.providerFailed,
    ).length;
  const values = [
    [t("totalKol"), tasks.length],
    [t("readyStat"), tasks.length - published],
    [t("published"), published],
    [t("overdue"), overdue],
    [
      t("complete24"),
      `${tasks.length ? Math.round((done("h24") / tasks.length) * 100) : 0}%`,
    ],
    [
      t("complete7"),
      `${tasks.length ? Math.round((done("d7") / tasks.length) * 100) : 0}%`,
    ],
    [t("totalViews"), views],
    [t("engagement"), eng],
    [t("clicks"), "—"],
    [t("manualReview"), review],
  ];
  $("#stats").innerHTML = values
    .map(
      ([k, v]) =>
        `<div class="card stat"><span class="muted">${k}</span><strong>${v}</strong></div>`,
    )
    .join("");
  $("#rows").innerHTML = "";
  shown.forEach((task) => {
    const tr = document.createElement("tr");
    if (!task.submission && new Date(task.publishAt) < now)
      tr.className = "overdue";
    if (task.metrics.providerFailed)
      tr.className = "review";
    [
      task.handle,
      task.wave,
      new Date(task.publishAt).toLocaleString(),
      statusLabel(task.status),
      task.submission?.url || "—",
      displayMetric(task.metrics, "h24", t("unableVerify")),
      displayMetric(task.metrics, "d7", t("unableVerify")),
      displayMetric(task.metrics, "likes", t("unableVerify")),
      displayMetric(task.metrics, "replies", t("unableVerify")),
      displayMetric(task.metrics, "reposts", t("unableVerify")),
      task.metrics.providerFailed ? t("unableVerify") : task.metrics.mode === "mock" ? t("mockSource") : task.metrics.mode === "live" ? t("liveSource") : t("waitingSource"),
    ].forEach((v) => {
      const td = document.createElement("td");
      td.textContent = v;
      tr.append(td);
    });
    const td = document.createElement("td"),
      b = document.createElement("button");
    b.textContent = t("view");
    b.className = "secondary";
    b.onclick = () => details(task);
    td.append(b);
    tr.append(td);
    $("#rows").append(tr);
  });
}
function details(t) {
  $("#detailBody").textContent = "";
  const h = document.createElement("h2");
  h.textContent = t.handle;
  const pre = document.createElement("pre");
  pre.textContent = JSON.stringify(
    {
      angle: t.angle,
      status: t.status,
      submission: t.submission,
      metricSnapshots: t.metrics.history || [],
    },
    null,
    2,
  );
  $("#detailBody").append(h, pre);
  $("#detail").showModal();
}
$("#signIn").onclick = signIn;
$("#passwordForm").onsubmit = savePassword;
$("#backToLogin").onclick = async () => {
  history.replaceState({}, "", location.pathname);
  if (supabase) await supabase.auth.signOut();
  settingPassword = false;
  showLogin();
};
$("#signOut").onclick = async () => {
  if (isDemo) {
    sessionStorage.removeItem("kol_demo_admin");
    showLogin();
  } else await supabase.auth.signOut();
};
$("#close").onclick = () => $("#detail").close();
["search", "wave", "filterStatus"].forEach(
  (id) => ($("#" + id).oninput = render),
);
$("#export").onclick = () => {
  const head = [
      "KOL",
      "Wave",
      "Publish At",
      "Status",
      "Post URL",
      "24h Views",
      "7d Views",
      "Likes",
      "Replies",
      "Reposts",
      "Source",
    ],
    rows = tasks.map((t) => [
      t.handle,
      t.wave,
      t.publishAt,
      t.status,
      t.submission?.url || "",
      t.metrics.h24,
      t.metrics.d7,
      t.metrics.likes,
      t.metrics.replies,
      t.metrics.reposts,
      t.metrics.source,
    ]),
    csv = [head, ...rows].map((r) => r.map(csvCell).join(",")).join("\n"),
    a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  a.download = "magne-kol-export.csv";
  a.click();
  URL.revokeObjectURL(a.href);
};
init();
document.addEventListener("kol:language", () => location.reload());
