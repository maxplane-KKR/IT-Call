import type { IncidentRecord, Shift } from "./oncall";

function csvCell(value: string | number): string {
  let text = String(value);
  if (/^\s*[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}

function csvRow(values: Array<string | number>): string {
  return values.map(csvCell).join(",");
}

export function createDailySummaryCsv(
  records: IncidentRecord[],
  shifts: Shift[],
  month: string,
): { filename: string; content: string } {
  const rows: string[] = [
    csvRow(["เงื่อนไขการจ่าย"]),
    csvRow(["ค่าเวรพื้นฐาน", 100]),
    csvRow(["X-ray - Tele", 400]),
    csvRow(["งานทั่วไป", 200]),
    csvRow(["เพดานต่อเวร", 800]),
    csvRow([""]),
    csvRow(["รายละเอียดรายวัน"]),
    csvRow(["วันที่", "เวลา", "ผู้ปฏิบัติงาน", "ประเภท", "แผนก", "รายละเอียด"]),
    ...records.map((record) => csvRow([record.workDate, record.time, record.worker, record.category, record.department, record.detail])),
    csvRow([""]),
    csvRow(["สรุปรายบุคคล"]),
    csvRow(["ผู้ปฏิบัติงาน", "จำนวนเวร", "จำนวนเหตุ", "ค่าตอบแทน"]),
  ];

  const workers = new Map<string, { shifts: number; incidents: number; compensation: number }>();
  for (const shift of shifts) {
    const summary = workers.get(shift.worker) ?? { shifts: 0, incidents: 0, compensation: 0 };
    summary.shifts += 1;
    summary.incidents += shift.incidentCount;
    summary.compensation += shift.capped;
    workers.set(shift.worker, summary);
  }
  for (const [worker, summary] of workers) {
    rows.push(csvRow([worker, summary.shifts, summary.incidents, summary.compensation]));
  }

  return {
    filename: `IT_OnCall_รายวันและสรุปยอด_${month || "ทุกเดือน"}.csv`,
    content: `\uFEFF${rows.join("\r\n")}`,
  };
}

export function downloadCsv(filename: string, content: string): void {
  const url = URL.createObjectURL(new Blob([content], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
