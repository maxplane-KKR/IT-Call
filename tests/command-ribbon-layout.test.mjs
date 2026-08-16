import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("มี Command Ribbon และลำดับ visual sections ที่กำหนด", async () => {
  const [html, css] = await Promise.all([
    readFile(new URL("../public/IT-Call-Skeuomorph.html", import.meta.url), "utf8"),
    readFile(new URL("../public/css/styles.css", import.meta.url), "utf8"),
  ]);
  assert.match(html, /id="cardThemePreview"/);
  assert.match(html, /class="command-ribbon [^"]+"/);
  assert.match(html, /class="operations-grid [^"]+"/);
  assert.match(html, /class="team-summary-card [^"]+"/);
  assert.match(html, /class="log-section [^"]+"/);
  assert.match(css, /\.command-ribbon-layout[\s\S]*\.operations-grid[\s\S]*\.team-summary-card[\s\S]*\.log-section/);
});

test("รักษา ID ที่ renderer เดิมใช้งานครบ", async () => {
  const html = await readFile(new URL("../public/IT-Call-Skeuomorph.html", import.meta.url), "utf8");
  for (const id of [
    "recordCount", "monthSelector", "totalTickets", "topDept", "topStaff",
    "hrTableBody", "hrTotal", "dailyChart", "timeChart", "deptChart", "staffChart",
    "deptFilter", "searchInput", "tableBody", "tablePagination", "prevPageBtn", "nextPageBtn",
  ]) assert.match(html, new RegExp(`id="${id}"`));
});
