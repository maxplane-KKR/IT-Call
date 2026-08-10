import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("mobile metric cards share stable rows without overflowing narrow screens", async () => {
  const [html, css] = await Promise.all([
    readFile(new URL("../public/IT-Call-Skeuomorph.html", import.meta.url), "utf8"),
    readFile(new URL("../public/css/styles.css", import.meta.url), "utf8"),
  ]);

  assert.match(html, /mobile-metrics-grid/);
  assert.equal((html.match(/mobile-metric-card/g) ?? []).length, 4);
  assert.match(css, /\.mobile-metrics-grid[\s\S]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/);
  assert.match(css, /\.mobile-metric-card[\s\S]*min-width:\s*0/);
  assert.match(css, /\.mobile-metric-card[\s\S]*height:\s*100%/);
});
