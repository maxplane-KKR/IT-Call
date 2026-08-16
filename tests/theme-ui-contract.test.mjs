import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("มี Theme Drawer ที่เข้าถึงได้และพรีเซ็ตครบ 6 ธีม", async () => {
  const html = await readFile(new URL("../public/IT-Call-Skeuomorph.html", import.meta.url), "utf8");
  assert.match(html, /id="themePanelToggle"[^>]*aria-controls="themePanel"[^>]*aria-expanded="false"/);
  assert.match(html, /id="themePanel"[^>]*role="dialog"[^>]*aria-hidden="true"/);
  assert.match(html, /id="cardThemeStatus"[^>]*role="status"[^>]*aria-live="polite"/);
  assert.equal((html.match(/class="theme-preset /g) ?? []).length, 6);
  for (const theme of ["mint", "neon", "rose", "sunset", "netflix", "luxury"]) {
    assert.match(html, new RegExp(`data-theme="theme-${theme}"`));
  }
});

test("theme drawer มีตัวควบคุมโหมดการแสดงผลเพียงจุดเดียว", async () => {
  const html = await readFile(new URL("../public/IT-Call-Skeuomorph.html", import.meta.url), "utf8");
  assert.doesNotMatch(html, /id="cardGlassMode"/);
  assert.equal((html.match(/id="appThemeToggle"/g) ?? []).length, 1);
});

test("Custom Image ผูกกับ Hero และไม่มี body background mutation", async () => {
  const [html, script] = await Promise.all([
    readFile(new URL("../public/IT-Call-Skeuomorph.html", import.meta.url), "utf8"),
    readFile(new URL("../public/js/theme-system.js", import.meta.url), "utf8"),
  ]);
  assert.match(html, /id="cardThemePreview"/);
  assert.match(html, /id="cardGlassSurface"/);
  assert.match(script, /cardThemePreview/);
  assert.doesNotMatch(script, /document\.body\.style\.backgroundImage/);
  assert.match(script, /itcall:themechange/);
});

test("compact cards ใช้ surface จากธีมเดียวกับ desktop", async () => {
  const css = await readFile(new URL("../public/css/styles.css", import.meta.url), "utf8");
  assert.match(css, /#mobile-layout\s+\.glass-card,\s*#mobile-layout\s+\.mobile-metric-card\s*\{[^}]*background:\s*var\(--theme-surface\)/);
  assert.match(css, /\.command-ribbon-layout\s+\.command-ribbon\s*>\s*\.glass-card\s*\{[^}]*background:\s*var\(--theme-surface\)/);
  assert.match(css, /\.command-hero-surface h2\s*\{[^}]*color:\s*#fff/);
});

test("sliders ของธีมส่งผลกับ surface ใน compact layout", async () => {
  const [css, script] = await Promise.all([
    readFile(new URL("../public/css/styles.css", import.meta.url), "utf8"),
    readFile(new URL("../public/js/theme-system.js", import.meta.url), "utf8"),
  ]);
  assert.match(script, /root\.style\.setProperty\("--theme-card-opacity", String\(opacity\)\)/);
  assert.match(script, /root\.style\.setProperty\("--theme-card-blur", `\$\{state\.blur\}px`\)/);
  assert.match(css, /body\s*\{[^}]*--theme-surface:\s*rgba\(var\(--theme-surface-rgb\),\s*var\(--theme-card-opacity\)\)/);
  assert.match(css, /#mobile-layout\s+\.glass-card,[\s\S]*?background:\s*var\(--theme-surface\)[^}]*backdrop-filter:\s*blur\(var\(--theme-card-blur\)\)/);
});
