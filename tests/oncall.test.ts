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

describe("on-call compensation", () => {
  it("groups per worker and date and applies exact rates", () => {
    const shifts = aggregateShifts(rows);
    expect(shifts).toHaveLength(2);
    expect(shifts[0]).toMatchObject({ worker: "A", teleCount: 1, generalCount: 1, uncapped: 700, capped: 700 });
    expect(buildDashboardSeries(rows, shifts)).toEqual({
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
    const shifts = aggregateShifts([...rows, ...rows.slice(0, 1), ...rows.slice(0, 1)]);
    expect(shifts.find((shift) => shift.worker === "A")).toMatchObject({ uncapped: 1500, capped: 800, capAdjustment: 700 });
  });

  it("summarizes payable totals", () => {
    expect(summarizeShifts(aggregateShifts(rows))).toMatchObject({ shiftCount: 2, teleIncidents: 1, generalIncidents: 2, eligibleCompensation: 1000 });
  });

  it("normalizes valid rows and rejects malformed dates", () => {
    expect(normalizeRows([{ "ผู้ปฏิบัติงาน": "A", "วันที่": "1/7/2026", "ประเภท": "ทั่วไป" }])).toHaveLength(1);
    expect(normalizeRows([{ "ผู้ปฏิบัติงาน": "A", "วันที่": "45/7/2026", "ประเภท": "ทั่วไป" }])).toHaveLength(0);
  });

  it("applies every active filter together", () => {
    expect(filterRecords(rows, { month: "2026-07", worker: "A", category: "ทั่วไป", department: "ER" })).toHaveLength(1);
  });
});
