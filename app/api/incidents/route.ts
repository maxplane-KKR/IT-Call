import { createIncidentSource } from "../../../lib/incidents-source.mjs";

const SOURCE_URL = "https://script.google.com/macros/s/AKfycbzet3nNEL9X8pEqB0YiqseO8GylRGTQZbtcCw4EVBfro19JkmPUouoCmVq6OjO2mMM2zA/exec";

const incidentSource = createIncidentSource({
  fetchSource: async () => {
    const response = await fetch(SOURCE_URL, {
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) throw new Error(`Apps Script returned ${response.status}`);
    return response.json();
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
