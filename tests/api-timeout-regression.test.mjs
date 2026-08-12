import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { fetchWithTimeoutRetry } from "../lib/upstream-fetch.mjs";

test("the incidents route retries a stalled upstream within the edge budget", async () => {
  const route = await readFile(
    new URL("../app/api/incidents/route.ts", import.meta.url),
    "utf8",
  );

  assert.match(route, /fetchWithTimeoutRetry/);
  assert.match(route, /attempts:\s*2/);
  assert.match(route, /timeoutMs:\s*8_000/);
});

test("a stalled upstream request is retried once", async () => {
  let calls = 0;
  const response = await fetchWithTimeoutRetry("https://example.test/incidents", {
    attempts: 2,
    timeoutMs: 5,
    retryDelayMs: 0,
    fetchImpl: async (_url, { signal }) => {
      calls += 1;
      if (calls === 1) {
        return new Promise((_resolve, reject) => {
          signal.addEventListener("abort", () => {
            reject(new DOMException("Timed out", "AbortError"));
          }, { once: true });
        });
      }
      return Response.json([{ id: "recovered" }]);
    },
  });

  assert.equal(calls, 2);
  assert.deepEqual(await response.json(), [{ id: "recovered" }]);
});
