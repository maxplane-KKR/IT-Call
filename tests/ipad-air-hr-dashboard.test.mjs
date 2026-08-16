import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("HR summary is available in the dedicated Team tab", async () => {
  const html = await readFile(
    new URL("../public/IT-Call-Skeuomorph.html", import.meta.url),
    "utf8",
  );

  const teamStart = html.indexOf('id="mobile-section-team"');
  const hrContainer = html.indexOf('id="mobileHRContainer"');
  const chartsSection = html.indexOf('id="mobile-section-charts"');

  assert.ok(teamStart >= 0);
  assert.ok(hrContainer > teamStart);
  assert.ok(chartsSection > hrContainer);
  assert.match(html, /class="tablet-dashboard-hr-card[^"]*"/);
  assert.doesNotMatch(html, /data-tab="hr"/);
  assert.deepEqual(
    [...html.matchAll(/data-tab="(dashboard|team|charts|log)"/g)].map((match) => match[1]),
    ["dashboard", "team", "charts", "log"],
  );
});
