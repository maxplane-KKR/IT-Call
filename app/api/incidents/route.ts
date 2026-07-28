const SOURCE_URL = "https://script.google.com/macros/s/AKfycbzet3nNEL9X8pEqB0YiqseO8GylRGTQZbtcCw4EVBfro19JkmPUouoCmVq6OjO2mMM2zA/exec";

export async function GET() {
  try {
    const response = await fetch(SOURCE_URL, { cache: "no-store" });
    if (!response.ok) {
      return Response.json({ error: "Unable to load incidents" }, { status: 502 });
    }

    const payload: unknown = await response.json();
    if (!Array.isArray(payload)) {
      return Response.json({ error: "Invalid incidents response" }, { status: 502 });
    }

    return Response.json(payload, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return Response.json({ error: "Unable to load incidents" }, { status: 502 });
  }
}
