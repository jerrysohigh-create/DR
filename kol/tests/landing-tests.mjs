import assert from "node:assert/strict";
import {
  TEST_KOLS,
  validateLandingInput,
  buildTaskUrl,
  taskTokenKey,
  storeTaskToken,
} from "../js/landing.js";
assert.deepEqual(
  TEST_KOLS.map((k) => k.handle),
  ["CryptoDragon001", "Kryptomonach", "CryptoPanda_gl"],
);
assert.match(validateLandingInput("", ""), /Select/);
assert.match(validateLandingInput("not-a-task", "token"), /Select/);
assert.match(validateLandingInput("crypto-dragon", "   "), /token/);
assert.equal(validateLandingInput("crypto-dragon", "private-value"), "");
const values = new Map();
const storage = { setItem: (key, value) => values.set(key, value) };
storeTaskToken(storage, "crypto-panda", "  private-value  ");
assert.equal(taskTokenKey("crypto-panda"), "kol_token_crypto-panda");
assert.equal(values.get("kol_token_crypto-panda"), "private-value");
const url = new URL(
  buildTaskUrl("https://example.test/DR/kol/?old=1#x", "crypto-panda"),
);
assert.equal(url.pathname, "/DR/kol/");
assert.equal(url.searchParams.get("task"), "crypto-panda");
assert.equal(url.searchParams.has("token"), false);
assert.equal(url.searchParams.has("old"), false);
assert.equal(url.hash, "");
console.log("landing tests: PASS");
