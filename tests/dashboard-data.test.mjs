import assert from "node:assert/strict";
import test from "node:test";
import {
  filterRecords,
  normalizeLiveRows,
  sampleRecords,
  sortMonthsDescending,
  summarizeRecords,
  toCsv,
  visibleRecordWindow,
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
  assert.match(csv, /สรุปรายได้รายบุคคล/);
});

test("adds per-operator income summaries with brief event details", () => {
  const records = normalizeLiveRows([
    { operator: "A", date: "1/7/2026", time: "20:00:00", detail: "VPN access", type: "X-ray - Tele", dept: "ER" },
    { operator: "A", date: "1/7/2026", time: "21:00:00", detail: "ตรวจสอบระบบ", type: "X-ray - Tele", dept: "ER" },
    { operator: "A", date: "1/7/2026", time: "22:00:00", detail: "รีเซ็ตรหัสผ่าน", type: "ทั่วไป", dept: "ER" },
  ]);
  const csv = toCsv(records);

  assert.match(csv, /ผู้ปฏิบัติงาน,รายได้รวม \(บาท\),จำนวนรายการ,รายละเอียดโดยย่อ/);
  assert.match(csv, /A,800,3,Tele 2 ครั้ง · ทั่วไป 1 ครั้ง/);
});

test("includes compensation conditions in the CSV", () => {
  const csv = toCsv(sampleRecords.slice(0, 1));

  assert.match(csv, /เงื่อนไขค่าตอบแทน/);
  assert.match(csv, /ค่าเวร,100,บาท/);
  assert.match(csv, /Tele,400,บาท/);
  assert.match(csv, /ทั่วไป,200,บาท/);
  assert.match(csv, /เพดาน,800,บาท/);
});

test("normalizes the previous version incident source into dashboard records", () => {
  const [record] = normalizeLiveRows([{
    timestamp: "23/7/2026, 10:00:00",
    operator: "อัศวิน",
    date: "23/7/2026",
    time: "10:00:00",
    detail: "VPN access",
    type: "X-ray - Tele",
    dept: "Xray",
  }]);

  assert.equal(record.operator, "อัศวิน");
  assert.equal(record.date, "2026-07-23");
  assert.equal(record.eventType, "Tele");
  assert.equal(record.department, "Xray");
  assert.equal(record.shiftKey, "อัศวิน|2026-07-23");
});

test("uses the previous version's per-shift base rate and cap", () => {
  const records = normalizeLiveRows([
    { operator: "A", date: "1/7/2026", time: "20:00:00", type: "X-ray - Tele", dept: "ER" },
    { operator: "A", date: "1/7/2026", time: "21:00:00", type: "X-ray - Tele", dept: "ER" },
    { operator: "A", date: "1/7/2026", time: "22:00:00", type: "ทั่วไป", dept: "ER" },
  ]);

  const summary = summarizeRecords(records);

  assert.equal(summary.shifts, 1);
  assert.equal(summary.paidCompensation, 800);
  assert.equal(summary.cappedAmount, 300);
  assert.equal(summary.teleEvents, 2);
  assert.equal(summary.generalEvents, 1);
});

test("does not export removed level or duration columns", () => {
  const csv = toCsv(normalizeLiveRows([
    { operator: "A", date: "1/7/2026", time: "20:00:00", type: "ทั่วไป", dept: "ER" },
  ]));

  assert.doesNotMatch(csv, /ระดับ|ระยะเวลา/);
});

test("sorts month filter options from the latest data to the oldest", () => {
  const months = sortMonthsDescending([
    { month: "มกราคม 2563", date: "2020-01-02" },
    { month: "กรกฎาคม 2569", date: "2026-07-23" },
    { month: "มิถุนายน 2569", date: "2026-06-29" },
    { month: "กรกฎาคม 2569", date: "2026-07-01" },
  ]);

  assert.deepEqual(months, ["กรกฎาคม 2569", "มิถุนายน 2569", "มกราคม 2563"]);
});

test("limits the operation log render window without dropping filtered totals", () => {
  const records = Array.from({ length: 225 }, (_, index) => ({ id: index }));

  assert.deepEqual(
    visibleRecordWindow(records, 100).map((record) => record.id),
    Array.from({ length: 100 }, (_, index) => index),
  );
  assert.equal(records.length, 225);
});

test("normalizes a production-sized Apps Script response within the interaction budget", () => {
  const rows = Array.from({ length: 1_000 }, (_, index) => ({
    operator: `Operator ${index % 4}`,
    date: `${(index % 28) + 1}/7/2026`,
    time: "20:00:00",
    type: "X-ray - Tele",
    dept: `Department ${index % 20}`,
  }));
  const startedAt = performance.now();

  assert.equal(normalizeLiveRows(rows).length, rows.length);
  assert.ok(
    performance.now() - startedAt < 500,
    "normalization should leave enough main-thread time for filter interactions",
  );
});
