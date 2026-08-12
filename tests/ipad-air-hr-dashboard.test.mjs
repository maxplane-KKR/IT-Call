import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("HR summary is embedded in Dashboard and removed from bottom navigation", async () => {
  const html = await readFile(
    new URL("../public/IT-Call-Skeuomorph.html", import.meta.url),
    "utf8",
  );

  const dashboardStart = html.indexOf('id="mobile-section-dashboard"');
  const hrContainer = html.indexOf('id="mobileHRContainer"');
  const chartsSection = html.indexOf('id="mobile-section-charts"');

  assert.ok(dashboardStart >= 0);
  assert.ok(hrContainer > dashboardStart);
  assert.ok(chartsSection > hrContainer);
  assert.match(html, /class="tablet-dashboard-hr-card[^"]*"/);
  assert.doesNotMatch(html, /data-tab="hr"/);
  assert.deepEqual(
    [...html.matchAll(/data-tab="(dashboard|log|charts)"/g)].map((match) => match[1]),
    ["dashboard", "log", "charts"],
  );
});
