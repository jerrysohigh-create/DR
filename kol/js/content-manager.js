import { config } from "./supabase-client.js";
import { t } from "./i18n.js";
const $ = (s) => document.querySelector(s),
  lines = (v) =>
    v
      .split("\n")
      .map((x) => x.trim())
      .filter(Boolean);
const mimeRules = {
  "image/png": {
    ext: "png",
    max: 5242880,
    magic: (b) =>
      b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47,
  },
  "image/jpeg": {
    ext: "jpg",
    max: 5242880,
    magic: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  },
  "image/webp": {
    ext: "webp",
    max: 5242880,
    magic: (b) =>
      String.fromCharCode(...b.slice(0, 4)) === "RIFF" &&
      String.fromCharCode(...b.slice(8, 12)) === "WEBP",
  },
  "video/mp4": {
    ext: "mp4",
    max: 18874368,
    magic: (b) => String.fromCharCode(...b.slice(4, 8)) === "ftyp",
  },
  "video/webm": {
    ext: "webm",
    max: 18874368,
    magic: (b) =>
      b[0] === 0x1a && b[1] === 0x45 && b[2] === 0xdf && b[3] === 0xa3,
  },
};
let ctx,
  current,
  replaceId = "";
const msg = (id, text, bad = false) => {
  const el = $(id);
  el.textContent = text;
  el.className = bad ? "error" : "success";
};
async function call(action, extra = {}) {
  const s = ctx.getSession(),
    r = await fetch(`${config.SUPABASE_URL}/functions/v1/admin-content`, {
      method: "POST",
      headers: {
        apikey: config.SUPABASE_ANON_KEY,
        authorization: `Bearer ${s.access_token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ action, taskId: current.id, ...extra }),
    }),
    d = await r.json().catch(() => ({}));
  if (!r.ok) throw Error(d.error || t("requestFailed"));
  return d;
}
function makeUtm() {
  if (!$("#campaignEnabled").checked) return "";
  try {
    const u = new URL($("#campaignBase").value.trim());
    u.searchParams.set("utm_source", "x");
    u.searchParams.set("utm_medium", "kol");
    u.searchParams.set(
      "utm_campaign",
      $("#utmCampaign").value.trim() ||
        current.wave.toLowerCase().replace(/\W+/g, "-"),
    );
    u.searchParams.set(
      "utm_content",
      $("#utmContent").value.trim() || current.handle.replace(/^@/, ""),
    );
    return u.toString();
  } catch {
    return "";
  }
}
function updateUtm() {
  const value = makeUtm();
  $("#utmPreview").textContent = value || t("validUrl");
}
function choose() {
  current = ctx.getTasks().find((x) => x.id === $("#contentTask").value);
  if (!current) return $("#contentEditor").classList.add("hidden");
  $("#contentEditor").classList.remove("hidden");
  $("#taskTitle").value = current.title || "MAGNE.AI Campaign Task";
  $("#taskStatus").value = current.status;
  $("#taskAngle").value = current.angle || "";
  $("#taskCopy").value = current.copy || "";
  $("#taskPublishAt").value = new Date(current.publishAt)
    .toISOString()
    .slice(0, 16);
  $("#taskRequirements").value = (current.requirements || []).join("\n");
  $("#taskProhibited").value = (current.prohibited || []).join("\n");
  $("#campaignEnabled").checked = !!current.campaignLinkEnabled;
  $("#campaignBase").value = current.campaignBaseUrl || "";
  try {
    const u = new URL(current.utm || "");
    $("#utmCampaign").value = u.searchParams.get("utm_campaign") || "";
    $("#utmContent").value = u.searchParams.get("utm_content") || "";
  } catch {
    $("#utmCampaign").value = "";
    $("#utmContent").value = "";
  }
  toggleCampaign();
  countCopy();
  renderAssets();
}
function refreshSelect() {
  const prior = $("#contentTask").value;
  $("#contentTask").innerHTML = `<option value="">${t("selectTask")}</option>`;
  ctx.getTasks().forEach((t) => {
    const o = document.createElement("option");
    o.value = t.id;
    o.textContent = `${t.handle} · ${t.wave}`;
    $("#contentTask").append(o);
  });
  if (ctx.getTasks().some((t) => t.id === prior))
    $("#contentTask").value = prior;
  choose();
}
function toggleCampaign() {
  $("#campaignFields").classList.toggle(
    "hidden",
    !$("#campaignEnabled").checked,
  );
  updateUtm();
}
function countCopy() {
  $("#copyCount").textContent = t("characters", { count: $("#taskCopy").value.length });
}
async function save() {
  try {
    $("#saveTask").disabled = true;
    const utm = makeUtm();
    if ($("#campaignEnabled").checked && !utm)
      throw Error(t("validBase"));
    await call("save-task", {
      data: {
        title: $("#taskTitle").value,
        status: $("#taskStatus").value,
        angle: $("#taskAngle").value,
        copy: $("#taskCopy").value,
        publishAt: $("#taskPublishAt").value,
        requirements: lines($("#taskRequirements").value),
        prohibited: lines($("#taskProhibited").value),
        campaignLinkEnabled: $("#campaignEnabled").checked,
        campaignBaseUrl: $("#campaignBase").value,
        utmCampaign: $("#utmCampaign").value,
        utmContent: $("#utmContent").value,
      },
    });
    msg("#contentMsg", t("saved"));
    await ctx.reload();
    refreshSelect();
  } catch (e) {
    msg("#contentMsg", e.message, true);
  } finally {
    $("#saveTask").disabled = false;
  }
}
async function validateFile(file) {
  // File signature is verified before any upload; the user-facing text is localized.
  const rule = mimeRules[file.type];
  if (!rule) throw Error(t("unsupported"));
  if (file.size > rule.max)
    throw Error(
      file.type.startsWith("image/")
        ? t("imageLarge")
        : t("videoLarge"),
    );
  const bytes = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  if (!rule.magic(bytes))
    throw Error(t("signature"));
  return rule;
}
async function upload(file) {
  try {
    if (!current) throw Error(t("selectFirst"));
    if (
      (current.assets || []).filter((x) => x.active).length >= 10 &&
      !replaceId
    )
      throw Error(t("maxAssets"));
    await validateFile(file);
    msg("#assetMsg", t("uploading"));
    const form = new FormData();
    form.set("action", "upload-asset");
    form.set("taskId", current.id);
    form.set("file", file, file.name);
    if (replaceId) form.set("oldAssetId", replaceId);
    const s = ctx.getSession(),
      response = await fetch(
        `${config.SUPABASE_URL}/functions/v1/admin-content`,
        {
          method: "POST",
          headers: {
            apikey: config.SUPABASE_ANON_KEY,
            authorization: `Bearer ${s.access_token}`,
          },
          body: form,
        },
      ),
      data = await response.json().catch(() => ({}));
    if (!response.ok) throw Error(data.error || t("uploadFailed"));
    replaceId = "";
    msg("#assetMsg", t("uploaded"));
    $("#assetFile").value = "";
    await ctx.reload();
    refreshSelect();
  } catch (e) {
    replaceId = "";
    msg("#assetMsg", e.message, true);
  }
}
function renderAssets() {
  const box = $("#assetPreview");
  box.textContent = "";
  const active = (current.assets || []).filter((a) => a.active);
  (current.assets || []).forEach((a) => {
    const row = document.createElement("article");
    row.className = `managed-asset${a.active ? "" : " inactive"}`;
    const media = document.createElement(a.type === "video" ? "video" : "img");
    media.src = a.previewUrl || a.url || "";
    if (a.type === "video") media.controls = true;
    const info = document.createElement("div");
    const name = document.createElement("strong");
    name.textContent = a.name;
    const meta = document.createElement("small");
    meta.textContent = `${a.type} · ${a.active ? t("active") : t("inactive")}`;
    info.append(name, meta);
    const actions = document.createElement("div");
    actions.className = "mini-actions";
    const button = (label, fn) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "secondary";
      b.textContent = label;
      b.onclick = fn;
      actions.append(b);
    };
    if (a.active) {
      const activeIndex = active.findIndex((x) => x.id === a.id);
      button("↑", () => move(activeIndex, -1));
      button("↓", () => move(activeIndex, 1));
      button(t("replace"), () => {
        replaceId = a.id;
        $("#assetFile").click();
      });
      button(t("deactivate"), () => assetAction("deactivate-asset", a.id));
    }
    button(t("delete"), () => assetAction("delete-asset", a.id));
    row.append(media, info, actions);
    box.append(row);
  });
}
async function move(index, delta) {
  const active = (current.assets || []).filter((x) => x.active),
    next = index + delta;
  if (next < 0 || next >= active.length) return;
  [active[index], active[next]] = [active[next], active[index]];
  await call("reorder-assets", { assetIds: active.map((x) => x.id) });
  await ctx.reload();
  refreshSelect();
}
async function assetAction(action, id) {
  if (action === "delete-asset" && !confirm(t("deleteConfirm")))
    return;
  try {
    await call(action, { assetId: id });
    await ctx.reload();
    refreshSelect();
  } catch (e) {
    msg("#assetMsg", e.message, true);
  }
}
export function setupContentManager(options) {
  ctx = options;
  refreshSelect();
  $("#contentTask").onchange = choose;
  $("#campaignEnabled").onchange = toggleCampaign;
  ["campaignBase", "utmCampaign", "utmContent"].forEach(
    (id) => ($("#" + id).oninput = updateUtm),
  );
  $("#taskCopy").oninput = countCopy;
  $("#saveTask").onclick = save;
  $("#assetFile").onchange = () =>
    $("#assetFile").files[0] && upload($("#assetFile").files[0]);
  $("#refreshContent").onclick = async () => {
    await ctx.reload();
    refreshSelect();
  };
}
