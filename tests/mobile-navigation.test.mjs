import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("changes to the adjacent tab only for an intentional horizontal swipe", async () => {
  let navigation = {};
  try {
    navigation = await import("../public/mobile-navigation.mjs");
  } catch (error) {
    if (error?.code !== "ERR_MODULE_NOT_FOUND") throw error;
  }

  assert.equal(typeof navigation.resolveSwipeTab, "function");
  assert.equal(navigation.resolveSwipeTab("dashboard", -72, 8), "hr");
  assert.equal(navigation.resolveSwipeTab("charts", 70, 5), "hr");
  assert.equal(navigation.resolveSwipeTab("dashboard", 80, 4), "dashboard");
  assert.equal(navigation.resolveSwipeTab("log", -80, 4), "log");
  assert.equal(navigation.resolveSwipeTab("hr", -35, 3), "hr");
  assert.equal(navigation.resolveSwipeTab("hr", -80, 90), "hr");
});

test("mobile tab bar exposes native-like state and horizontal overflow", async () => {
  const [html, css] = await Promise.all([
    readFile(new URL("../public/IT-Call-Skeuomorph.html", import.meta.url), "utf8"),
    readFile(new URL("../public/css/styles.css", import.meta.url), "utf8"),
  ]);

  assert.match(html, /role="tablist"/);
  assert.match(html, /role="tab"/);
  assert.match(html, /aria-selected="true"/);
  assert.match(css, /\.mobile-bottom-nav[\s\S]*overflow-x:\s*auto/);
  assert.match(css, /scroll-snap-type:\s*x\s+proximity/);
  assert.match(css, /padding:[^;]*env\(safe-area-inset-bottom/);
});
