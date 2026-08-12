import {
  createIncidentSource,
  recentIncidentRows,
} from "../../../lib/incidents-source.mjs";
import { fetchWithTimeoutRetry } from "../../../lib/upstream-fetch.mjs";
import { getRequestExecutionContext } from "vinext/shims/request-context";

const SOURCE_URL = "https://script.google.com/macros/s/AKfycbzet3nNEL9X8pEqB0YiqseO8GylRGTQZbtcCw4EVBfro19JkmPUouoCmVq6OjO2mMM2zA/exec";
const EDGE_CACHE_KEY = new Request("https://it-oncall.internal/cache/incidents-rolling-3y-v1");

function edgeCache() {
  return (globalThis.caches as CacheStorage & { default?: Cache } | undefined)?.default ?? null;
}

const incidentSource = createIncidentSource({
  readSharedCache: async () => {
    const cache = edgeCache();
    const response = cache ? await cache.match(EDGE_CACHE_KEY) : null;
    return response ? response.json() : null;
  },
  writeSharedCache: async (entry) => {
    const cache = edgeCache();
    if (!cache) return;
    await cache.put(
      EDGE_CACHE_KEY,
      Response.json(entry, {
        headers: { "Cache-Control": "public, max-age=86400" },
      }),
    );
  },
  scheduleBackground: (promise) => {
    getRequestExecutionContext()?.waitUntil(promise);
  },
  fetchSource: async () => {
    const response = await fetchWithTimeoutRetry(SOURCE_URL, {
      attempts: 2,
      timeoutMs: 20_000,
    });
    return recentIncidentRows(await response.json(), { years: 3 });
  },
});

export async function GET() {
  try {
    const payload: unknown = await incidentSource.load();

    return Response.json(payload, {
      headers: {
        "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=86400",
      },
    });
  } catch {
    return Response.json({ error: "Unable to load incidents" }, { status: 502 });
  }
}
