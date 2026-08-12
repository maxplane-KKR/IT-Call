import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("the iPad Air dashboard scrolls the main page instead of the HR card", async () => {
  const [html, css] = await Promise.all([
    readFile(new URL("../public/IT-Call-Skeuomorph.html", import.meta.url), "utf8"),
    readFile(new URL("../public/css/styles.css", import.meta.url), "utf8"),
  ]);

  assert.match(html, /tablet-dashboard-chart-card/);
  assert.match(html, /tablet-dashboard-hr-card/);
  assert.match(html, /tablet-dashboard-chart-frame/);
  assert.match(
    css,
    /@media \(min-width: 768px\) and \(max-width: 1279px\)[\s\S]*#app-container\s*{[^}]*overflow-y:\s*auto/,
  );
  assert.match(css, /#app-container > main\s*{[\s\S]*display:\s*flex/);
  assert.match(css, /#mobile-layout\s*{[^}]*flex:\s*1[^}]*overflow-y:\s*visible/);
  assert.match(css, /#mobile-section-dashboard:not\(\.hidden\)[^}]*min-height:\s*100%[^}]*height:\s*auto/);
  assert.match(css, /\.tablet-dashboard-chart-frame\s*{[^}]*flex:\s*none/);
  assert.match(css, /\.tablet-dashboard-hr-card\s*{[^}]*overflow:\s*visible/);
  assert.match(
    css,
    /#mobileHRContainer\s*{[^}]*overflow-y:\s*visible[^}]*overscroll-behavior-y:\s*auto/,
  );
});
