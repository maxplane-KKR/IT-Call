import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("app เริ่ม Theme System และ refresh charts เมื่อธีมเปลี่ยน", async () => {
  const app = await readFile(new URL("../public/js/app.js", import.meta.url), "utf8");
  assert.match(app, /import \{ initThemeSystem \} from '\.\/theme-system\.js'/);
  assert.match(app, /initThemeSystem\(\)/);
  assert.match(app, /addEventListener\('itcall:themechange'/);
  assert.match(app, /function getChartTheme\(\)/);
});

test("HTML ใช้ asset version เดียวกัน", async () => {
  const html = await readFile(new URL("../public/IT-Call-Skeuomorph.html", import.meta.url), "utf8");
  assert.match(html, /styles\.css\?v=20260816-1/);
  assert.match(html, /app\.js\?v=20260816-1/);
});
