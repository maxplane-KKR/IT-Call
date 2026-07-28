const ALL = "ทั้งหมด";

const rateByEventType = {
  Tele: 400,
  ทั่วไป: 200,
};

export const sampleRecords = Object.freeze([
  {
    id: "evt-001",
    date: "2026-07-04",
    time: "22:10",
    month: "กรกฎาคม 2026",
    operator: "เมธา",
    department: "Platform",
    eventType: "Tele",
    severity: "สูง",
    durationMinutes: 95,
    compensation: 400,
    capped: false,
  },
  {
    id: "evt-002",
    date: "2026-07-05",
    time: "01:45",
    month: "กรกฎาคม 2026",
    operator: "กานต์",
    department: "Infrastructure",
    eventType: "ทั่วไป",
    severity: "กลาง",
    durationMinutes: 55,
    compensation: 200,
    capped: false,
  },
  {
    id: "evt-003",
    date: "2026-07-08",
    time: "19:20",
    month: "กรกฎาคม 2026",
    operator: "ริน",
    department: "Service Desk",
    eventType: "Tele",
    severity: "สูง",
    durationMinutes: 120,
    compensation: 400,
    capped: false,
  },
  {
    id: "evt-004",
    date: "2026-07-11",
    time: "23:05",
    month: "กรกฎาคม 2026",
    operator: "เมธา",
    department: "Platform",
    eventType: "ทั่วไป",
    severity: "ต่ำ",
    durationMinutes: 35,
    compensation: 200,
    capped: false,
  },
  {
    id: "evt-005",
    date: "2026-07-14",
    time: "00:35",
    month: "กรกฎาคม 2026",
    operator: "กานต์",
    department: "Infrastructure",
    eventType: "Tele",
    severity: "วิกฤต",
    durationMinutes: 210,
    compensation: 800,
    capped: true,
  },
  {
    id: "evt-006",
    date: "2026-07-18",
    time: "17:40",
    month: "กรกฎาคม 2026",
    operator: "ริน",
    department: "Service Desk",
    eventType: "ทั่วไป",
    severity: "กลาง",
    durationMinutes: 70,
    compensation: 200,
    capped: false,
  },
  {
    id: "evt-007",
    date: "2026-06-22",
    time: "21:15",
    month: "มิถุนายน 2026",
    operator: "เมธา",
    department: "Platform",
    eventType: "Tele",
    severity: "สูง",
    durationMinutes: 110,
    compensation: 400,
    capped: false,
  },
  {
    id: "evt-008",
    date: "2026-06-27",
    time: "02:25",
    month: "มิถุนายน 2026",
    operator: "กานต์",
    department: "Infrastructure",
    eventType: "ทั่วไป",
    severity: "ต่ำ",
    durationMinutes: 40,
    compensation: 200,
    capped: false,
  },
  {
    id: "evt-009",
    date: "2026-06-29",
    time: "20:50",
    month: "มิถุนายน 2026",
    operator: "ริน",
    department: "Service Desk",
    eventType: "Tele",
    severity: "กลาง",
    durationMinutes: 85,
    compensation: 400,
    capped: false,
  },
]);

const matches = (selected, value) => !selected || selected === ALL || selected === value;

export function filterRecords(records, filters = {}) {
  return records.filter((record) =>
    matches(filters.month, record.month) &&
    matches(filters.operator, record.operator) &&
    matches(filters.eventType, record.eventType) &&
    matches(filters.department, record.department),
  );
}

function groupedBy(records, key, valueKey = null) {
  const totals = new Map();
  for (const record of records) {
    const keyValue = record[key];
    const amount = valueKey ? Number(record[valueKey]) : 1;
    totals.set(keyValue, (totals.get(keyValue) ?? 0) + amount);
  }
  return [...totals.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label, "th"));
}

export function summarizeRecords(records) {
  const paidCompensation = records.reduce((sum, record) => sum + record.compensation, 0);
  const cappedAmount = records
    .filter((record) => record.capped)
    .reduce((sum, record) => sum + record.compensation, 0);
  const byOperator = groupedBy(records, "operator", "compensation");
  const byEventType = groupedBy(records, "eventType");
  const byHour = groupedBy(
    records.map((record) => ({ ...record, hour: `${record.time.slice(0, 2)}:00` })),
    "hour",
  ).slice(0, 5);
  const byOperatorCases = groupedBy(records, "operator");
  const totalCases = records.length || 1;

  return {
    paidCompensation,
    shifts: records.length,
    teleEvents: records.filter((record) => record.eventType === "Tele").length,
    generalEvents: records.filter((record) => record.eventType === "ทั่วไป").length,
    cappedAmount,
    byOperator,
    byEventType,
    byHour,
    caseShare: byOperatorCases.map((item) => ({
      ...item,
      percent: Math.round((item.value / totalCases) * 100),
    })),
  };
}

function escapeCsv(value) {
  const stringValue = String(value ?? "");
  return /[",\n]/.test(stringValue)
    ? `"${stringValue.replaceAll('"', '""')}"`
    : stringValue;
}

export function toCsv(records) {
  const header = [
    "วันที่",
    "ผู้ปฏิบัติงาน",
    "แผนก",
    "ประเภทเหตุการณ์",
    "ระดับความรุนแรง",
    "ระยะเวลา (นาที)",
    "ค่าตอบแทน (บาท)",
  ];
  const rows = records.map((record) => [
    `${record.date} ${record.time}`,
    record.operator,
    record.department,
    record.eventType,
    record.severity,
    record.durationMinutes,
    record.compensation,
  ]);
  return [header, ...rows].map((row) => row.map(escapeCsv).join(",")).join("\n");
}

export const rateCard = Object.freeze([
  { label: "ค่าเวร", value: 100, suffix: "บาท" },
  { label: "Tele", value: rateByEventType.Tele, suffix: "บาท" },
  { label: "ทั่วไป", value: rateByEventType.ทั่วไป, suffix: "บาท" },
  { label: "เพดาน", value: 800, suffix: "บาท" },
]);
