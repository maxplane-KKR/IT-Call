import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("places Log immediately after Dashboard in the mobile tab order", async () => {
  const [html, navigation] = await Promise.all([
    readFile(new URL("../public/IT-Call-Skeuomorph.html", import.meta.url), "utf8"),
    import("../public/mobile-navigation.mjs"),
  ]);

  const dashboardIndex = html.indexOf('data-tab="dashboard"');
  const logIndex = html.indexOf('data-tab="log"');
  const hrIndex = html.indexOf('data-tab="hr"');
  assert.ok(dashboardIndex < logIndex && logIndex < hrIndex);
  assert.deepEqual(navigation.MOBILE_TABS, ["dashboard", "log", "hr", "charts"]);
});
