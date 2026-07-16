import { describe, expect, it } from "vitest";
import { aggregateShifts, type IncidentRecord } from "../app/lib/oncall";
import { createDailySummaryCsv } from "../app/lib/csv";

describe("createDailySummaryCsv", () => {
  it("creates a safe BOM-prefixed report with details and worker summaries", () => {
    const records: IncidentRecord[] = [{
      worker: "=A1",
      workDate: "2026-07-01",
      time: "20:00",
      category: "X-ray - Tele",
      department: "ER",
      detail: "@cmd",
    }];

    const result = createDailySummaryCsv(records, aggregateShifts(records), "2026-07");

    expect(result.filename).toBe("IT_OnCall_เธฃเธฒเธขเธงเธฑเธเนเธฅเธฐเธชเธฃเธธเธเธขเธญเธ”_2026-07.csv");
    expect(result.content.startsWith("\uFEFF")).toBe(true);
    expect(result.content).toContain('"\'=A1"');
    expect(result.content).toContain('"\'@cmd"');
    expect(result.content).toContain('"เธฃเธฒเธขเธฅเธฐเน€เธญเธตเธขเธ”เธฃเธฒเธขเธงเธฑเธ"');
    expect(result.content).toContain('"เธชเธฃเธธเธเธฃเธฒเธขเธเธธเธเธเธฅ"');
    expect(result.content).toContain('"เน€เธเธทเนเธญเธเนเธเธเธฒเธฃเธเนเธฒเธข"');
  });

  it("quotes every cell, doubles quotes, and uses the all-month filename fallback", () => {
    const records: IncidentRecord[] = [{ worker: " A\"B", workDate: "2026-07-01", time: "", category: "ทั่วไป", department: "", detail: "- formula" }];
    const result = createDailySummaryCsv(records, aggregateShifts(records), "");
    expect(result.filename).toBe("IT_OnCall_เธฃเธฒเธขเธงเธฑเธเนเธฅเธฐเธชเธฃเธธเธเธขเธญเธ”_เธ—เธธเธเน€เธ”เธทเธญเธ.csv");
    expect(result.content).toContain('" A""B"');
    expect(result.content).toContain('"\'- formula"');
    expect(result.content.slice(1).split("\n").filter(Boolean).every((line) => line.split(",").every((cell) => cell.startsWith('"')))).toBe(true);
  });
});
