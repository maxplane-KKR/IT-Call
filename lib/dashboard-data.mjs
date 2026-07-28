const ALL = "ทั้งหมด";

const rateByEventType = {
  Tele: 400,
  ทั่วไป: 200,
};

const LIVE_TELE_CATEGORY = "X-ray - Tele";
const LIVE_GENERAL_CATEGORY = "ทั่วไป";
const BASE_SHIFT_RATE = 100;
const SHIFT_CAP = 800;
const thaiMonthFormatter = new Intl.DateTimeFormat("th-TH", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

export const INCIDENTS_ENDPOINT = "/api/incidents";

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

function liveStringValue(row, ...keys) {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === "string") return value.trim();
    if (typeof value === "number") return String(value);
  }
  return "";
}

function normalizeLiveDate(value) {
  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  const localMatch = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(value);
  let year;
  let month;
  let day;

  if (isoMatch) {
    [, year, month, day] = isoMatch.map(Number);
  } else if (localMatch) {
    [, day, month, year] = localMatch.map(Number);
  } else {
    return null;
  }

  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) return null;

  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function monthLabel(date) {
  return thaiMonthFormatter.format(new Date(`${date}T00:00:00Z`));
}

export function normalizeLiveRows(input) {
  if (!Array.isArray(input)) return [];

  return input.flatMap((item, index) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return [];
    const row = item;
    const operator = liveStringValue(row, "operator", "worker", "ผู้ปฏิบัติงาน");
    const date = normalizeLiveDate(liveStringValue(row, "date", "workDate", "วันที่"));
    const sourceCategory = liveStringValue(row, "type", "category", "ประเภท");
    if (!operator || !date || !sourceCategory) return [];

    const eventType = sourceCategory === LIVE_TELE_CATEGORY ? "Tele" : sourceCategory;
    const compensation = eventType === "Tele" ? 400 : 200;
    return [{
      id: `live-${date}-${index}`,
      date,
      time: liveStringValue(row, "time", "เวลา"),
      month: monthLabel(date),
      operator,
      department: liveStringValue(row, "dept", "department", "แผนก"),
      eventType,
      sourceCategory,
      detail: liveStringValue(row, "detail", "รายละเอียด"),
      shiftKey: `${operator}|${date}`,
      baseCompensation: compensation,
      compensation,
      capped: false,
    }];
  });
}

export function filterRecords(records, filters = {}) {
  return records.filter((record) =>
    matches(filters.month, record.month) &&
    matches(filters.operator, record.operator) &&
    matches(filters.eventType, record.eventType) &&
    matches(filters.department, record.department),
  );
}

export function visibleRecordWindow(records, limit) {
  return records.slice(0, Math.max(0, limit));
}

export function sortMonthsDescending(records) {
  const monthKeys = new Map();
  for (const record of records) {
    if (!record?.month) continue;
    const sortKey = /^\d{4}-\d{2}/.exec(record.date ?? "")?.[0] ?? "0000-00";
    const currentKey = monthKeys.get(record.month);
    if (!currentKey || sortKey > currentKey) monthKeys.set(record.month, sortKey);
  }

  return [...monthKeys.entries()]
    .sort(([labelA, keyA], [labelB, keyB]) => keyB.localeCompare(keyA) || labelA.localeCompare(labelB, "th"))
    .map(([label]) => label);
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
  if (records.length && records.every((record) => record.shiftKey)) {
    const shifts = new Map();
    for (const record of records) {
      const current = shifts.get(record.shiftKey) ?? {
        operator: record.operator,
        uncapped: BASE_SHIFT_RATE,
      };
      current.uncapped += record.baseCompensation;
      shifts.set(record.shiftKey, current);
    }

    const shiftRows = [...shifts.values()].map((shift) => ({
      ...shift,
      capped: Math.min(shift.uncapped, SHIFT_CAP),
    }));
    const paidCompensation = shiftRows.reduce((sum, shift) => sum + shift.capped, 0);
    const cappedAmount = shiftRows.reduce((sum, shift) => sum + Math.max(0, shift.uncapped - shift.capped), 0);
    const operatorTotals = new Map();
    for (const shift of shiftRows) {
      operatorTotals.set(shift.operator, (operatorTotals.get(shift.operator) ?? 0) + shift.capped);
    }
    const byOperator = [...operatorTotals.entries()]
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label, "th"));
    const byEventType = groupedBy(records, "eventType");
    const byHour = groupedBy(
      records.map((record) => ({ ...record, hour: `${record.time.slice(0, 2)}:00` })),
      "hour",
    ).slice(0, 5);
    const byOperatorCases = groupedBy(records, "operator");
    const totalCases = records.length || 1;

    return {
      paidCompensation,
      shifts: shiftRows.length,
      teleEvents: records.filter((record) => record.eventType === "Tele").length,
      generalEvents: records.filter((record) => record.eventType === LIVE_GENERAL_CATEGORY).length,
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
    "รายละเอียด",
    "ค่าตอบแทน (บาท)",
  ];
  const rows = records.map((record) => [
    `${record.date} ${record.time}`,
    record.operator,
    record.department,
    record.eventType,
    record.detail,
    record.compensation,
  ]);

  const operatorDetails = new Map();
  for (const record of records) {
    const current = operatorDetails.get(record.operator) ?? {
      cases: 0,
      eventCounts: new Map(),
      details: [],
    };
    current.cases += 1;
    current.eventCounts.set(record.eventType, (current.eventCounts.get(record.eventType) ?? 0) + 1);
    if (record.detail && current.details.length < 2) current.details.push(record.detail);
    operatorDetails.set(record.operator, current);
  }

  const summary = summarizeRecords(records);
  const incomeByOperator = new Map(summary.byOperator.map((item) => [item.label, item.value]));
  const summaryRows = [...operatorDetails.entries()]
    .sort(([operatorA], [operatorB]) => operatorA.localeCompare(operatorB, "th"))
    .map(([operator, detail]) => {
      const eventSummary = [...detail.eventCounts.entries()]
        .map(([eventType, count]) => `${eventType} ${count} ครั้ง`)
        .join(" · ");
      const briefDetails = detail.details.length ? ` · ${detail.details.join(" / ")}` : "";
      return [
        operator,
        incomeByOperator.get(operator) ?? 0,
        detail.cases,
        `${eventSummary}${briefDetails}`,
      ];
    });
  const conditionRows = rateCard.map((rate) => [rate.label, rate.value, rate.suffix]);

  return [
    header,
    ...rows,
    [],
    ["สรุปรายได้รายบุคคล"],
    ["ผู้ปฏิบัติงาน", "รายได้รวม (บาท)", "จำนวนรายการ", "รายละเอียดโดยย่อ"],
    ...summaryRows,
    [],
    ["เงื่อนไขค่าตอบแทน"],
    ["รายการ", "อัตรา", "หน่วย"],
    ...conditionRows,
  ].map((row) => row.map(escapeCsv).join(",")).join("\n");
}

export const rateCard = Object.freeze([
  { label: "ค่าเวร", value: 100, suffix: "บาท" },
  { label: "Tele", value: rateByEventType.Tele, suffix: "บาท" },
  { label: "ทั่วไป", value: rateByEventType.ทั่วไป, suffix: "บาท" },
  { label: "เพดาน", value: 800, suffix: "บาท" },
]);
