import assert from "node:assert/strict";
import test from "node:test";
import { fetchJsonWithRetry } from "../public/js/fetch-resilience.js";

test("the browser retries once when its request times out", async () => {
  const originalFetch = globalThis.fetch;
  const originalWindow = globalThis.window;
  let calls = 0;
  globalThis.window = globalThis;
  globalThis.fetch = async (_url, { signal }) => {
    calls += 1;
    if (calls === 1) {
      return new Promise((_resolve, reject) => {
        signal.addEventListener("abort", () => {
          reject(new DOMException("Timed out", "AbortError"));
        }, { once: true });
      });
    }
    return Response.json([{ id: "recovered-after-timeout" }]);
  };

  try {
    const rows = await fetchJsonWithRetry("/api/incidents", {
      timeoutMs: 5,
      attempts: 2,
      retryDelayMs: 0,
    });
    assert.deepEqual(rows, [{ id: "recovered-after-timeout" }]);
    assert.equal(calls, 2);
  } finally {
    globalThis.fetch = originalFetch;
    globalThis.window = originalWindow;
  }
});
