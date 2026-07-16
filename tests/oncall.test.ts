import { describe, expect, it } from "vitest";
import {
  aggregateShifts,
  buildDashboardSeries,
  filterRecords,
  normalizeRows,
  summarizeShifts,
  type IncidentRecord,
} from "../app/lib/oncall";

const rows: IncidentRecord[] = [
  { worker: "A", workDate: "2026-07-01", time: "20:15", category: "X-ray - Tele", department: "ER", detail: "HN001" },
  { worker: "A", workDate: "2026-07-01", time: "21:10", category: "ทั่วไป", department: "ER", detail: "Reset" },
  { worker: "B", workDate: "2026-07-02", time: "08:00", category: "ทั่วไป", department: "OPD", detail: "Printer" },
];

const workerAShiftRows = rows.slice(0, 2);

const cappedShiftRows: IncidentRecord[] = [
  ...Array.from({ length: 3 }, (_, index) => ({
    worker: "A",
    workDate: "2026-07-01",
    time: `20:0${index}`,
    category: "X-ray - Tele",
    department: "ER",
    detail: `Tele ${index + 1}`,
  })),
  { worker: "A", workDate: "2026-07-01", time: "21:00", category: "ทั่วไป", department: "ER", detail: "General" },
];

describe("on-call compensation", () => {
  it("normalizes the field names returned by the Apps Script", () => {
    expect(normalizeRows([{
      timestamp: "31/1/2020, 14:48:04",
      operator: "อัศวิน",
      date: "2/1/2020",
      time: "15:00:00",
      detail: "add vpn user 906134",
      type: "ทั่วไป",
      dept: "Xray",
    }])).toEqual([{
      worker: "อัศวิน",
      workDate: "2020-01-02",
      time: "15:00:00",
      detail: "add vpn user 906134",
      category: "ทั่วไป",
      department: "Xray",
    }]);
  });

  it("groups per worker and date and applies exact rates", () => {
    const shifts = aggregateShifts(workerAShiftRows);
    expect(shifts).toEqual([
      {
        key: "A|2026-07-01",
        worker: "A",
        workDate: "2026-07-01",
        teleCount: 1,
        generalCount: 1,
        incidentCount: 2,
        uncapped: 700,
        capped: 700,
        capAdjustment: 0,
      },
    ]);
    expect(buildDashboardSeries(rows, aggregateShifts(rows))).toEqual({
      compensationByWorker: [
        { worker: "A", amount: 700 },
        { worker: "B", amount: 300 },
      ],
      incidentsByCategory: [
        { category: "X-ray - Tele", count: 1 },
        { category: "ทั่วไป", count: 2 },
      ],
    });
  });

  it("caps each shift at 800 THB", () => {
    expect(aggregateShifts(cappedShiftRows)).toEqual([
      {
        key: "A|2026-07-01",
        worker: "A",
        workDate: "2026-07-01",
        teleCount: 3,
        generalCount: 1,
        incidentCount: 4,
        uncapped: 1500,
        capped: 800,
        capAdjustment: 700,
      },
    ]);
  });

  it("summarizes payable totals", () => {
    expect(summarizeShifts(aggregateShifts(rows))).toEqual({
      shiftCount: 2,
      teleIncidents: 1,
      generalIncidents: 2,
      totalIncidents: 3,
      uncappedCompensation: 1000,
      eligibleCompensation: 1000,
      capAdjustment: 0,
    });
  });

  it("normalizes valid rows and rejects malformed dates", () => {
    expect(normalizeRows([{ "ผู้ปฏิบัติงาน": "A", "วันที่": "1/7/2026", "ประเภท": "ทั่วไป" }])).toEqual([
      { worker: "A", workDate: "2026-07-01", time: "", category: "ทั่วไป", department: "", detail: "" },
    ]);
    expect(normalizeRows([{ "ผู้ปฏิบัติงาน": "A", "วันที่": "45/7/2026", "ประเภท": "ทั่วไป" }])).toEqual([]);
  });

  it("applies every active filter together", () => {
    expect(filterRecords(rows, { month: "2026-07", worker: "A", category: "ทั่วไป", department: "ER" })).toEqual([rows[1]]);
  });
});
