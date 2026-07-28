import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const codeUrl = new URL("../apps-script/Code.gs", import.meta.url);

test("Code.gs filters the sheet to a rolling three-year window", async () => {
  const source = await readFile(codeUrl, "utf8");
  const context = {};
  vm.runInNewContext(source, context);
  const cutoff = context.createRollingCutoff_(new Date(2026, 6, 28), 3);
  const rows = context.buildRecentIncidents_([
    ["28/7/2023, 08:00:00", "A", "28/7/2023", "08:00:00", "Recent", "ทั่วไป", "ER"],
    ["27/7/2023, 08:00:00", "B", "27/7/2023", "08:00:00", "Old", "ทั่วไป", "ER"],
  ], cutoff);

  assert.equal(rows.length, 1);
  assert.deepEqual(
    JSON.parse(JSON.stringify(rows[0])),
    {
      timestamp: "28/7/2023, 08:00:00",
      operator: "A",
      date: "28/7/2023",
      time: "08:00:00",
      detail: "Recent",
      type: "ทั่วไป",
      dept: "ER",
    },
  );
});

test("Code.gs protects Apps Script with shared cache and a refresh lock", async () => {
  const source = await readFile(codeUrl, "utf8");

  assert.match(source, /lookbackYears:\s*3/);
  assert.match(source, /CacheService\.getScriptCache\(\)/);
  assert.match(source, /LockService\.getScriptLock\(\)/);
  assert.match(source, /getRange\(2,\s*1,\s*lastRow - 1,\s*DATA_COLUMN_COUNT\)/);
  assert.doesNotMatch(source, /getDataRange\(\)/);
});
