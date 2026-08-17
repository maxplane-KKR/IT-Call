import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("แดชบอร์ดมี semantic landmarks และโครงสร้างที่อ่านได้ด้วยคีย์บอร์ด", async () => {
  const html = await readFile(
    new URL("../public/IT-Call-Skeuomorph.html", import.meta.url),
    "utf8",
  );

  assert.match(html, /<a class="skip-link" href="#main-content">/);
  assert.match(html, /<main id="main-content"[^>]*tabindex="-1"/);
  assert.match(html, /<section id="desktop-layout"[^>]*aria-label=/);
  assert.match(html, /<section id="mobile-layout"[^>]*aria-label=/);
  assert.match(html, /<article class="glass-card[^>]*aria-label="Ticket ทั้งหมด"/);
  assert.match(html, /<section id="mobile-section-log"[^>]*aria-labelledby="mobileLogTitle"/);
});

test("ตารางและกราฟมีคำอธิบายสำหรับเทคโนโลยีช่วยเหลือ", async () => {
  const html = await readFile(
    new URL("../public/IT-Call-Skeuomorph.html", import.meta.url),
    "utf8",
  );

  assert.ok((html.match(/<caption class="visually-hidden">/g) ?? []).length >= 2);
  assert.ok((html.match(/<th scope="col"/g) ?? []).length >= 10);
  assert.match(html, /<canvas id="dailyChart"[^>]*role="img"[^>]*aria-label=/);
  assert.match(html, /<canvas id="mobileSummaryChart"[^>]*role="img"[^>]*aria-label=/);
  assert.match(html, /id="toast"[^>]*role="status"[^>]*aria-live="polite"/);
});
