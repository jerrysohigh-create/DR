import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { detectLanguage, getLanguage, LANGUAGE_KEY, messages, applyLanguage, setupLanguageSwitcher } from "../js/i18n.js";

assert.equal(detectLanguage("zh-TW"), "tc");
assert.equal(detectLanguage("zh-Hant-HK"), "tc");
assert.equal(detectLanguage("zh-CN"), "en");
assert.equal(detectLanguage("en-US"), "en");
assert.equal(getLanguage({ getItem: (key) => key === LANGUAGE_KEY ? "tc" : null }), "tc");
assert.equal(getLanguage({ getItem: () => "invalid" }), "en");
assert.ok(messages.tc.submit && messages.en.submit);
const originalDocument = globalThis.document, originalStorage = globalThis.localStorage, originalEvent = globalThis.CustomEvent;
const stored = new Map([[LANGUAGE_KEY, "tc"]]);
globalThis.localStorage = { getItem: (k) => stored.get(k), setItem: (k, v) => stored.set(k, v) };
const textNode = { dataset: { i18n: "submit" }, textContent: "" };
const inputNode = { dataset: { i18nPlaceholder: "search" }, placeholder: "" };
const langNode = { dataset: { lang: "tc" }, setAttribute(k, v) { this[k] = v; } };
globalThis.document = { documentElement: {}, querySelectorAll: () => [], dispatchEvent() {} };
globalThis.CustomEvent = class { constructor(type, options) { this.type = type; this.detail = options.detail; } };
applyLanguage({ querySelectorAll(selector) { return selector === "[data-i18n]" ? [textNode] : selector === "[data-i18n-placeholder]" ? [inputNode] : [langNode]; } });
assert.equal(globalThis.document.documentElement.lang, "zh-Hant");
assert.equal(textNode.textContent, messages.tc.submit);
assert.equal(inputNode.placeholder, messages.tc.search);
assert.equal(langNode["aria-pressed"], "true");
globalThis.document = originalDocument; globalThis.localStorage = originalStorage; globalThis.CustomEvent = originalEvent;

// A translated option label must never alter the English backend value.
const adminHtml = readFileSync(new URL("../admin.html", import.meta.url), "utf8");
for (const value of ["Ready to Publish", "Published"])
  assert.equal((adminHtml.match(new RegExp(`<option value="${value}" data-i18n=`, "g")) || []).length, 2);

const clickStored = new Map();
const switches = ["en", "tc"].map((lang) => ({ dataset: { lang }, attrs: {}, addEventListener(type, fn) { this[type] = fn; }, setAttribute(k, v) { this.attrs[k] = v; } }));
const translatable = { dataset: { i18n: "submit" }, textContent: "" };
globalThis.localStorage = { getItem: (k) => clickStored.get(k), setItem: (k, v) => clickStored.set(k, v) };
globalThis.CustomEvent = class { constructor(type, options) { this.type = type; this.detail = options.detail; } };
globalThis.document = {
  documentElement: {}, dispatchEvent() {},
  querySelectorAll(selector) { return selector === "[data-lang]" ? switches : selector === "[data-i18n]" ? [translatable] : []; },
};
setupLanguageSwitcher();
switches[1].click();
assert.equal(clickStored.get(LANGUAGE_KEY), "tc");
assert.equal(globalThis.document.documentElement.lang, "zh-Hant");
assert.equal(switches[1].attrs["aria-pressed"], "true");
assert.equal(translatable.textContent, messages.tc.submit);
globalThis.document = originalDocument; globalThis.localStorage = originalStorage; globalThis.CustomEvent = originalEvent;

for (const page of ["index.html", "admin.html"]) {
  const html = readFileSync(new URL(`../${page}`, import.meta.url), "utf8");
  assert.match(html, /data-lang="en"/); assert.match(html, /data-lang="tc"/);
  for (const [, key] of html.matchAll(/data-i18n(?:-placeholder)?="([^"]+)"/g)) {
    assert.ok(messages.en[key], `${page}: missing en key ${key}`);
    assert.ok(messages.tc[key], `${page}: missing tc key ${key}`);
  }
}
const css = readFileSync(new URL("../css/app.css", import.meta.url), "utf8");
assert.match(css, /@media \(max-width:375px\)/);
assert.match(css, /\.language-switch button/);
console.log("i18n tests: PASS");
