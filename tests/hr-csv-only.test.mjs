import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("HR actions offer CSV export without the unused copy control", async () => {
  const [html, app] = await Promise.all([
    readFile(new URL("../public/IT-Call-Skeuomorph.html", import.meta.url), "utf8"),
    readFile(new URL("../public/js/app.js", import.meta.url), "utf8"),
  ]);

  assert.match(html, /export-hr-btn/);
  assert.doesNotMatch(html, /copy-hr-btn/);
  assert.doesNotMatch(app, /copyHRReportText|copy-hr-btn/);
});
