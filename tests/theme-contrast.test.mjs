import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("dark compact surfaces keep readable text and active controls in the card theme", async () => {
  const css = await readFile(new URL("../public/css/styles.css", import.meta.url), "utf8");

  assert.match(css, /\.mobile-log-card\s*\{[\s\S]*background:\s*var\(--theme-surface\)/);
  assert.match(css, /\.mobile-log-card\s*\{[\s\S]*color:\s*var\(--theme-text\)/);
  assert.match(css, /\.mobile-log-card \.text-slate-800\s*\{[^}]*color:\s*var\(--theme-text\)\s*!important/);
  assert.match(css, /\.month-btn\.skeuo-btn-primary[\s\S]*?\{[^}]*background:\s*var\(--theme-primary\)/);
  assert.match(css, /\.month-btn\.skeuo-btn-primary[\s\S]*?\{[^}]*color:\s*var\(--theme-on-primary\)/);
  assert.match(css, /\.mobile-log-card \.bg-blue-50,[\s\S]*?color:\s*var\(--theme-text\)\s*!important/);
  assert.match(css, /header p\.text-blue-200\s*\{[^}]*opacity:\s*1\s*!important/);
});
