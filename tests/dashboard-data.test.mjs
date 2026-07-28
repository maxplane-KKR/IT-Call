import assert from "node:assert/strict";
import test from "node:test";
import {
  filterRecords,
  sampleRecords,
  summarizeRecords,
  toCsv,
} from "../lib/dashboard-data.mjs";

test("filters records by operator and event type", () => {
  const result = filterRecords(sampleRecords, {
    month: "ทั้งหมด",
    operator: "เมธา",
    eventType: "Tele",
    department: "ทั้งหมด",
  });

  assert.ok(result.length > 0);
  assert.ok(
    result.every(
      (record) => record.operator === "เมธา" && record.eventType === "Tele",
    ),
  );
});

test("summarizes compensation, shifts, and event counts from visible records", () => {
  const summary = summarizeRecords(sampleRecords);

  assert.equal(summary.shifts, sampleRecords.length);
  assert.equal(
    summary.teleEvents + summary.generalEvents,
    sampleRecords.length,
  );
  assert.ok(summary.paidCompensation > 0);
  assert.ok(summary.byOperator.length > 0);
  assert.ok(summary.byEventType.length > 0);
});

test("exports visible records as a CSV with a header", () => {
  const csv = toCsv(sampleRecords.slice(0, 2));

  assert.match(csv, /^วันที่,ผู้ปฏิบัติงาน,แผนก,ประเภทเหตุการณ์/);
  assert.equal(csv.trim().split("\n").length, 3);
});
