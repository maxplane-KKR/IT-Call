import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { isMobileScreen } from "../public/js/mobile-view.js";

test("iPad Air portrait and landscape use the compact tabbed layout", async () => {
  const [html, css] = await Promise.all([
    readFile(new URL("../public/IT-Call-Skeuomorph.html", import.meta.url), "utf8"),
    readFile(new URL("../public/css/styles.css", import.meta.url), "utf8"),
  ]);

  assert.match(html, /id="desktop-layout" class="hidden xl:block/);
  assert.match(html, /id="mobile-layout" class="block xl:hidden/);
  assert.match(html, /class="mobile-bottom-nav xl:hidden"/);
  assert.match(html, /pb-24 xl:pb-6/);
  assert.match(
    css,
    /@media \(min-width: 768px\) and \(max-width: 1279px\)[\s\S]*#mobile-section-dashboard:not\(\.hidden\)[\s\S]*grid-template-columns:\s*minmax\(0, 1fr\)[\s\S]*grid-template-rows:\s*auto auto auto/,
  );
  assert.match(
    css,
    /#mobile-section-dashboard \.mobile-metrics-grid[\s\S]*grid-template-columns:\s*repeat\(4, minmax\(0, 1fr\)\)/,
  );
  assert.match(
    css,
    /@media \(min-width: 1024px\) and \(max-width: 1279px\)[\s\S]*grid-template-columns:\s*minmax\(0, 0\.78fr\) minmax\(0, 1\.05fr\) minmax\(0, 1fr\)[\s\S]*grid-template-rows:\s*auto/,
  );
});

test("the shared viewport helper classifies both iPad Air orientations as compact", () => {
  const originalWindow = globalThis.window;

  try {
    globalThis.window = { innerWidth: 820 };
    assert.equal(isMobileScreen(), true);
    globalThis.window.innerWidth = 1180;
    assert.equal(isMobileScreen(), true);
    globalThis.window.innerWidth = 1280;
    assert.equal(isMobileScreen(), false);
  } finally {
    globalThis.window = originalWindow;
  }
});
