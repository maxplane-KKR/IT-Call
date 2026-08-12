import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("the iPad Air dashboard fills the viewport without page scrolling", async () => {
  const [html, css] = await Promise.all([
    readFile(new URL("../public/IT-Call-Skeuomorph.html", import.meta.url), "utf8"),
    readFile(new URL("../public/css/styles.css", import.meta.url), "utf8"),
  ]);

  assert.match(html, /tablet-dashboard-chart-card/);
  assert.match(html, /tablet-dashboard-hr-card/);
  assert.match(html, /tablet-dashboard-chart-frame/);
  assert.match(
    css,
    /@media \(min-width: 768px\) and \(max-width: 1279px\)[\s\S]*#app-container\s*{[\s\S]*overflow-y:\s*hidden/,
  );
  assert.match(css, /#app-container > main\s*{[\s\S]*display:\s*flex/);
  assert.match(css, /#mobile-layout\s*{[\s\S]*flex:\s*1[\s\S]*overflow-y:\s*auto/);
  assert.match(css, /#mobile-section-dashboard:not\(\.hidden\)[\s\S]*min-height:\s*100%/);
  assert.match(css, /\.tablet-dashboard-chart-frame\s*{[\s\S]*flex:\s*1/);
  assert.match(
    css,
    /#mobileHRContainer\s*{[\s\S]*overflow-y:\s*auto[\s\S]*overscroll-behavior-y:\s*contain/,
  );
});
