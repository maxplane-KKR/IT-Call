const DEFAULT_FRESH_MS = 5 * 60 * 1_000;

export function createIncidentSource({
  fetchSource,
  now = Date.now,
  freshMs = DEFAULT_FRESH_MS,
}) {
  let cached = null;
  let inFlight = null;

  async function refresh() {
    try {
      const rows = await fetchSource();
      if (!Array.isArray(rows)) throw new Error("Invalid incidents response");
      cached = { rows, fetchedAt: now() };
      return rows;
    } catch (error) {
      if (cached) return cached.rows;
      throw error;
    } finally {
      inFlight = null;
    }
  }

  return {
    load() {
      if (cached && now() - cached.fetchedAt < freshMs) return Promise.resolve(cached.rows);
      if (!inFlight) inFlight = refresh();
      return inFlight;
    },
  };
}
