export interface IncidentRecord {
  worker: string;
  workDate: string;
  time: string;
  category: string;
  department: string;
  detail: string;
}

export interface Filters {
  month?: string;
  worker?: string;
  category?: string;
  department?: string;
}

export interface Shift {
  key: string;
  worker: string;
  workDate: string;
  teleCount: number;
  generalCount: number;
  incidentCount: number;
  uncapped: number;
  capped: number;
  capAdjustment: number;
}

export interface Summary {
  shiftCount: number;
  teleIncidents: number;
  generalIncidents: number;
  totalIncidents: number;
  uncappedCompensation: number;
  eligibleCompensation: number;
  capAdjustment: number;
}

export interface DashboardSeries {
  compensationByWorker: Array<{ worker: string; amount: number }>;
  incidentsByCategory: Array<{ category: string; count: number }>;
}

const TELE_CATEGORY = "X-ray - Tele";
const BASE_RATE = 100;
const TELE_RATE = 400;
const GENERAL_RATE = 200;
const SHIFT_CAP = 800;

type UnknownRow = Record<string, unknown>;

function stringValue(row: UnknownRow, ...keys: string[]): string {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === "string") return value.trim();
    if (typeof value === "number") return String(value);
  }
  return "";
}

function normalizeDate(value: string): string | null {
  let year: number;
  let month: number;
  let day: number;

  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  const localMatch = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(value);
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
  ) {
    return null;
  }

  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function normalizeRows(input: unknown): IncidentRecord[] {
  if (!Array.isArray(input)) return [];

  const records: IncidentRecord[] = [];
  for (const item of input) {
    if (!item || typeof item !== "object" || Array.isArray(item)) continue;
    const row = item as UnknownRow;
    const worker = stringValue(row, "worker", "ผู้ปฏิบัติงาน");
    const workDate = normalizeDate(stringValue(row, "workDate", "วันที่"));
    const category = stringValue(row, "category", "ประเภท");
    if (!worker || !workDate || !category) continue;

    records.push({
      worker,
      workDate,
      time: stringValue(row, "time", "เวลา"),
      category,
      department: stringValue(row, "department", "แผนก"),
      detail: stringValue(row, "detail", "รายละเอียด"),
    });
  }
  return records;
}

export function aggregateShifts(records: IncidentRecord[]): Shift[] {
  const groups = new Map<string, Shift>();
  for (const record of records) {
    const key = `${record.worker}|${record.workDate}`;
    let shift = groups.get(key);
    if (!shift) {
      shift = {
        key,
        worker: record.worker,
        workDate: record.workDate,
        teleCount: 0,
        generalCount: 0,
        incidentCount: 0,
        uncapped: BASE_RATE,
        capped: 0,
        capAdjustment: 0,
      };
      groups.set(key, shift);
    }

    if (record.category === TELE_CATEGORY) shift.teleCount += 1;
    else shift.generalCount += 1;
    shift.incidentCount += 1;
    shift.uncapped += record.category === TELE_CATEGORY ? TELE_RATE : GENERAL_RATE;
  }

  return Array.from(groups.values(), (shift) => {
    const capped = Math.min(shift.uncapped, SHIFT_CAP);
    return { ...shift, capped, capAdjustment: shift.uncapped - capped };
  });
}

export function summarizeShifts(shifts: Shift[]): Summary {
  return shifts.reduce<Summary>(
    (summary, shift) => ({
      shiftCount: summary.shiftCount + 1,
      teleIncidents: summary.teleIncidents + shift.teleCount,
      generalIncidents: summary.generalIncidents + shift.generalCount,
      totalIncidents: summary.totalIncidents + shift.incidentCount,
      uncappedCompensation: summary.uncappedCompensation + shift.uncapped,
      eligibleCompensation: summary.eligibleCompensation + shift.capped,
      capAdjustment: summary.capAdjustment + shift.capAdjustment,
    }),
    {
      shiftCount: 0,
      teleIncidents: 0,
      generalIncidents: 0,
      totalIncidents: 0,
      uncappedCompensation: 0,
      eligibleCompensation: 0,
      capAdjustment: 0,
    },
  );
}

export function filterRecords(records: IncidentRecord[], filters: Filters): IncidentRecord[] {
  return records.filter((record) =>
    (!filters.month || record.workDate.startsWith(`${filters.month}-`)) &&
    (!filters.worker || record.worker === filters.worker) &&
    (!filters.category || record.category === filters.category) &&
    (!filters.department || record.department === filters.department),
  );
}

export function buildDashboardSeries(records: IncidentRecord[], shifts: Shift[]): DashboardSeries {
  const workerTotals = new Map<string, number>();
  for (const shift of shifts) {
    workerTotals.set(shift.worker, (workerTotals.get(shift.worker) ?? 0) + shift.capped);
  }

  const categoryTotals = new Map<string, number>();
  for (const record of records) {
    categoryTotals.set(record.category, (categoryTotals.get(record.category) ?? 0) + 1);
  }

  return {
    compensationByWorker: Array.from(workerTotals, ([worker, amount]) => ({ worker, amount })),
    incidentsByCategory: Array.from(categoryTotals, ([category, count]) => ({ category, count })),
  };
}
