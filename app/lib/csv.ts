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
    csvRow(["เน€เธเธทเนเธญเธเนเธเธเธฒเธฃเธเนเธฒเธข"]),
    csvRow(["เธเนเธฒเน€เธงเธฃเธเธทเนเธเธเธฒเธ", 100]),
    csvRow(["X-ray - Tele", 400]),
    csvRow(["เธเธฒเธเธ—เธฑเนเธงเนเธ", 200]),
    csvRow(["เน€เธเธ”เธฒเธเธ•เนเธญเน€เธงเธฃ", 800]),
    csvRow([""]),
    csvRow(["เธฃเธฒเธขเธฅเธฐเน€เธญเธตเธขเธ”เธฃเธฒเธขเธงเธฑเธ"]),
    csvRow(["เธงเธฑเธเธ—เธตเน", "เน€เธงเธฅเธฒ", "เธเธนเนเธเธเธดเธเธฑเธ•เธดเธเธฒเธ", "เธเธฃเธฐเน€เธ เธ—", "เนเธเธเธ", "เธฃเธฒเธขเธฅเธฐเน€เธญเธตเธขเธ”"]),
    ...records.map((record) => csvRow([record.workDate, record.time, record.worker, record.category, record.department, record.detail])),
    csvRow([""]),
    csvRow(["เธชเธฃเธธเธเธฃเธฒเธขเธเธธเธเธเธฅ"]),
    csvRow(["เธเธนเนเธเธเธดเธเธฑเธ•เธดเธเธฒเธ", "เธเธณเธเธงเธเน€เธงเธฃ", "เธเธณเธเธงเธเน€เธซเธ•เธธ", "เธเนเธฒเธ•เธญเธเนเธ—เธ"]),
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
    filename: `IT_OnCall_เธฃเธฒเธขเธงเธฑเธเนเธฅเธฐเธชเธฃเธธเธเธขเธญเธ”_${month || "เธ—เธธเธเน€เธ”เธทเธญเธ"}.csv`,
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
