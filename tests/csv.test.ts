import { describe, expect, it } from "vitest";
import { aggregateShifts, type IncidentRecord } from "../app/lib/oncall";
import { createDailySummaryCsv } from "../app/lib/csv";

describe("createDailySummaryCsv", () => {
  it("exports readable Thai labels and filename as UTF-8 with BOM", () => {
    const result = createDailySummaryCsv([], [], "2026-07");

    expect(result.filename).toBe("IT_OnCall_รายวันและสรุปยอด_2026-07.csv");
    expect(result.content.startsWith("\uFEFF")).toBe(true);
    expect(result.content).toContain('"เงื่อนไขการจ่าย"');
    expect(result.content).toContain('"รายละเอียดรายวัน"');
    expect(result.content).toContain('"สรุปรายบุคคล"');
    expect(result.content).not.toContain("เน€");
  });

  it("creates a safe report with details and worker summaries", () => {
    const records: IncidentRecord[] = [{
      worker: "=A1",
      workDate: "2026-07-01",
      time: "20:00",
      category: "X-ray - Tele",
      department: "ER",
      detail: "@cmd",
    }];
    const result = createDailySummaryCsv(records, aggregateShifts(records), "2026-07");

    expect(result.content).toContain('"\'=A1"');
    expect(result.content).toContain('"\'@cmd"');
    expect(result.content).toContain('"ผู้ปฏิบัติงาน"');
    expect(result.content).toContain('"ค่าตอบแทน"');
  });

  it("quotes cells and uses the all-month filename fallback", () => {
    const records: IncidentRecord[] = [{ worker: " A\"B", workDate: "2026-07-01", time: "", category: "ทั่วไป", department: "ER,North", detail: "- formula" }];
    const result = createDailySummaryCsv(records, aggregateShifts(records), "");

    expect(result.filename).toBe("IT_OnCall_รายวันและสรุปยอด_ทุกเดือน.csv");
    expect(result.content).toContain('" A""B"');
    expect(result.content).toContain('"\'- formula"');
    expect(result.content).toContain('\r\n"2026-07-01",""," A""B","ทั่วไป","ER,North","\'- formula"\r\n');
  });
});
