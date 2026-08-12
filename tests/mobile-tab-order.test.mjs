import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("keeps Dashboard, Log, and Charts in the compact navigation order", async () => {
  const [html, navigation] = await Promise.all([
    readFile(new URL("../public/IT-Call-Skeuomorph.html", import.meta.url), "utf8"),
    import("../public/mobile-navigation.mjs"),
  ]);

  const dashboardIndex = html.indexOf('data-tab="dashboard"');
  const logIndex = html.indexOf('data-tab="log"');
  const chartsIndex = html.indexOf('data-tab="charts"');
  assert.ok(dashboardIndex < logIndex && logIndex < chartsIndex);
  assert.equal(html.indexOf('data-tab="hr"'), -1);
  assert.deepEqual(navigation.MOBILE_TABS, ["dashboard", "log", "charts"]);
});
