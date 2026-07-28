const DEFAULT_FRESH_MS = 5 * 60 * 1_000;

function incidentDateTimestamp(row) {
  if (!row || typeof row !== "object" || Array.isArray(row)) return Number.NaN;
  const rawDate = row.date ?? row.workDate ?? row["วันที่"];
  if (typeof rawDate !== "string") return Number.NaN;

  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(rawDate);
  const local = /^(\d{1,2})\/(\d{1,2})\/(\d{4})/.exec(rawDate);
  const parts = iso
    ? { year: Number(iso[1]), month: Number(iso[2]), day: Number(iso[3]) }
    : local
      ? { year: Number(local[3]), month: Number(local[2]), day: Number(local[1]) }
      : null;
  if (!parts) return Number.NaN;

  const timestamp = Date.UTC(parts.year, parts.month - 1, parts.day);
  const date = new Date(timestamp);
  return date.getUTCFullYear() === parts.year
    && date.getUTCMonth() === parts.month - 1
    && date.getUTCDate() === parts.day
    ? timestamp
    : Number.NaN;
}

export function recentIncidentRows(rows, {
  now = Date.now(),
  years = 3,
} = {}) {
  if (!Array.isArray(rows)) return [];
  const cutoff = new Date(now);
  cutoff.setUTCHours(0, 0, 0, 0);
  cutoff.setUTCFullYear(cutoff.getUTCFullYear() - years);
  const cutoffTimestamp = cutoff.getTime();

  return rows.filter((row) => incidentDateTimestamp(row) >= cutoffTimestamp);
}

export function createIncidentSource({
  fetchSource,
  now = Date.now,
  freshMs = DEFAULT_FRESH_MS,
  readSharedCache = async () => null,
  writeSharedCache = async () => {},
  scheduleBackground = () => {},
}) {
  let cached = null;
  let inFlight = null;

  async function refresh() {
    try {
      const rows = await fetchSource();
      if (!Array.isArray(rows)) throw new Error("Invalid incidents response");
      cached = { rows, fetchedAt: now() };
      await writeSharedCache(cached);
      return rows;
    } catch (error) {
      if (cached) return cached.rows;
      throw error;
    } finally {
      inFlight = null;
    }
  }

  return {
    async load() {
      if (cached && now() - cached.fetchedAt < freshMs) return Promise.resolve(cached.rows);

      if (!cached) {
        let shared = null;
        try {
          shared = await readSharedCache();
        } catch {
          // The edge cache is an optimization; Apps Script remains the source of truth.
        }
        if (shared && Array.isArray(shared.rows) && Number.isFinite(shared.fetchedAt)) {
          cached = shared;
        }
      }

      if (cached && now() - cached.fetchedAt < freshMs) return cached.rows;

      if (cached) {
        if (!inFlight) {
          inFlight = refresh();
          scheduleBackground(inFlight.catch(() => undefined));
        }
        return cached.rows;
      }

      if (!inFlight) inFlight = refresh();
      return inFlight;
    },
  };
}
