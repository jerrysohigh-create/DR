import assert from "node:assert/strict";

async function openTab(url) {
  const target = await fetch(
    `http://127.0.0.1:9222/json/new?${encodeURIComponent(url)}`,
    { method: "PUT" },
  ).then((response) => response.json());
  const socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.onopen = resolve;
    socket.onerror = reject;
  });
  let id = 0;
  const pending = new Map();
  socket.onmessage = ({ data }) => {
    const message = JSON.parse(data);
    if (message.id && pending.has(message.id)) {
      pending.get(message.id)(message);
      pending.delete(message.id);
    }
  };
  const call = (method, params = {}) =>
    new Promise((resolve) => {
      pending.set(++id, resolve);
      socket.send(JSON.stringify({ id, method, params }));
    });
  const evaluate = async (expression) =>
    (
      await call("Runtime.evaluate", {
        expression,
        awaitPromise: true,
        returnByValue: true,
        userGesture: true,
      })
    ).result.result.value;
  return { evaluate, close: () => socket.close() };
}

const page = await openTab(
  "http://127.0.0.1:8765/kol/admin.html?__demo=1",
);
await new Promise((resolve) => setTimeout(resolve, 700));
await page.evaluate(`
  document.querySelector("#password").value = "demo-admin";
  document.querySelector("#signIn").click();
`);
await new Promise((resolve) => setTimeout(resolve, 300));

assert.equal(
  await page.evaluate(
    `!document.querySelector("#dashboard").classList.contains("hidden")`,
  ),
  true,
  "demo login should show the dashboard",
);
assert.ok(
  await page.evaluate(`document.querySelectorAll("#rows tr").length`),
  "login should render task rows",
);
assert.equal(
  await page.evaluate(`document.querySelector("#rows tr button").textContent`),
  "View",
  "rendered task rows should use the i18n View label",
);
await page.evaluate(`document.querySelector("#rows tr button").click()`);
assert.equal(
  await page.evaluate(
    `document.querySelector("#detail").open && document.querySelector("#detailBody h2").textContent.startsWith("@")`,
  ),
  true,
  "the rendered View action should open the selected task detail",
);

page.close();
console.log("admin render behavioral tests: PASS");
