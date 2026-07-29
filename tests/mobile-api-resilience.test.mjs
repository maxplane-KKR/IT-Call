import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { fetchJsonWithRetry } from "../public/js/fetch-resilience.js";

test("mobile API requests outlive the edge timeout and retry transient failures", async () => {
  const appScript = await readFile(
    new URL("../public/js/app.js", import.meta.url),
    "utf8",
  );

  assert.match(appScript, /timeoutMs:\s*50_000/);
  assert.match(appScript, /fetchJsonWithRetry/);
  assert.match(appScript, /window\.addEventListener\('online'/);
});

test("retries once when a mobile network transition interrupts fetch", async () => {
  const originalFetch = globalThis.fetch;
  const originalWindow = globalThis.window;
  let calls = 0;
  globalThis.window = globalThis;
  globalThis.fetch = async () => {
    calls += 1;
    if (calls === 1) throw new TypeError("Network connection changed");
    return Response.json([{ id: "recovered" }]);
  };

  try {
    const rows = await fetchJsonWithRetry("/api/incidents", {
      timeoutMs: 1_000,
      attempts: 2,
      retryDelayMs: 0,
    });
    assert.deepEqual(rows, [{ id: "recovered" }]);
    assert.equal(calls, 2);
  } finally {
    globalThis.fetch = originalFetch;
    globalThis.window = originalWindow;
  }
});
