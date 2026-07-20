import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const root = new URL("../../", import.meta.url).pathname;
const profile = await mkdtemp(join(tmpdir(), "kol-safe-image-"));
const server = spawn("python3", ["-m", "http.server", "8765", "--bind", "127.0.0.1"], { cwd: root, stdio: "ignore" });
const browser = spawn("chromium", ["--headless", "--disable-gpu", "--no-sandbox", "--remote-debugging-port=9222", `--user-data-dir=${profile}`, "about:blank"], { stdio: "ignore" });
const cleanup = async () => { server.kill("SIGTERM"); browser.kill("SIGTERM"); await rm(profile, { recursive: true, force: true }); };
for (let attempt = 0; attempt < 40; attempt++) {
  try { if ((await fetch("http://127.0.0.1:9222/json/version")).ok) break; } catch {}
  await new Promise((resolve) => setTimeout(resolve, 100));
  if (attempt === 39) { await cleanup(); throw new Error("Chromium CDP did not start"); }
}

const target = await fetch("http://127.0.0.1:9222/json/new?" + encodeURIComponent("http://127.0.0.1:8765/kol/?task=kryptomonach&token=TEST_KRYPTO&__demo=1"), { method: "PUT" }).then((response) => response.json());
const socket = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
let id = 0;
const pending = new Map();
socket.onmessage = ({ data }) => { const message = JSON.parse(data); if (pending.has(message.id)) { pending.get(message.id)(message); pending.delete(message.id); } };
const call = (method, params = {}) => new Promise((resolve) => { pending.set(++id, resolve); socket.send(JSON.stringify({ id, method, params })); });
const evaluate = async (expression) => (await call("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true })).result.result.value;
await call("Emulation.setDeviceMetricsOverride", { width: 375, height: 900, deviceScaleFactor: 1, mobile: true });
await new Promise((resolve) => setTimeout(resolve, 700));
const result = await evaluate(`(async()=>{
  const {renderAssets,downloadableAssets}=await import('./js/task.js');
  const fixture=[
    {type:'image',name:'Official PNG',url:'https://www.magne.ai/magne-web/phone-black.png'},
    {type:'image',name:'Unsafe',url:'javascript:alert(1)'},
    {type:'video',name:'YouTube',url:'https://youtube.com/shorts/ZMhyf6yImOc'}
  ];
  renderAssets(fixture);
  return {
    images:document.querySelectorAll('#assets img').length,
    links:document.querySelectorAll('#assets a').length,
    videos:document.querySelectorAll('#assets video').length,
    iframes:document.querySelectorAll('#assets iframe').length,
    downloadable:downloadableAssets(fixture).length,
    visible:!document.querySelector('#assetsCard').classList.contains('hidden'),
    width:document.documentElement.scrollWidth
  };
})()`);
assert.deepEqual(result, { images: 1, links: 1, videos: 0, iframes: 0, downloadable: 1, visible: true, width: 375 });
const downloadClicks = await evaluate(`(async()=>{
  let clicks=0;const original=HTMLAnchorElement.prototype.click;
  HTMLAnchorElement.prototype.click=function(){clicks++};
  document.querySelector('#downloadAll').click();
  await new Promise(resolve=>setTimeout(resolve,500));
  HTMLAnchorElement.prototype.click=original;return clicks;
})()`);
assert.equal(downloadClicks, 1, "Download All must click only the one validated image");
const loadFailure = await evaluate(`(()=>{
  const image=document.querySelector('#assets img');image.dispatchEvent(new Event('error'));
  return {images:document.querySelectorAll('#assets img').length,links:document.querySelectorAll('#assets a').length,hidden:document.querySelector('#assetsCard').classList.contains('hidden')};
})()`);
assert.deepEqual(loadFailure, { images: 0, links: 0, hidden: true });
const empty = await evaluate(`(async()=>{const {renderAssets}=await import('./js/task.js');renderAssets([]);return document.querySelector('#assetsCard').classList.contains('hidden')})()`);
assert.equal(empty, true);
socket.close();
await cleanup();
console.log("asset renderer Chromium tests: PASS");
