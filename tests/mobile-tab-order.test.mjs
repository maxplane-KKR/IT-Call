import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("keeps Dashboard, Team, Charts, and Log in the compact navigation order", async () => {
  const [html, navigation] = await Promise.all([
    readFile(new URL("../public/IT-Call-Skeuomorph.html", import.meta.url), "utf8"),
    import("../public/mobile-navigation.mjs"),
  ]);

  const dashboardIndex = html.indexOf('data-tab="dashboard"');
  const teamIndex = html.indexOf('data-tab="team"');
  const chartsIndex = html.indexOf('data-tab="charts"');
  const logIndex = html.indexOf('data-tab="log"');
  assert.ok(dashboardIndex < teamIndex && teamIndex < chartsIndex && chartsIndex < logIndex);
  assert.equal(html.indexOf('data-tab="hr"'), -1);
  assert.deepEqual(navigation.MOBILE_TABS, ["dashboard", "team", "charts", "log"]);
});
