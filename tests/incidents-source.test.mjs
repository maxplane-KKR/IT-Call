import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  createIncidentSource,
  recentIncidentRows,
} from "../lib/incidents-source.mjs";

test("reuses one upstream response during the five-minute freshness window", async () => {
  let now = 1_000;
  let calls = 0;
  const source = createIncidentSource({
    now: () => now,
    fetchSource: async () => {
      calls += 1;
      return [{ id: calls }];
    },
  });

  const [first, concurrent] = await Promise.all([source.load(), source.load()]);
  now += 299_000;
  const cached = await source.load();

  assert.deepEqual(first, [{ id: 1 }]);
  assert.deepEqual(concurrent, [{ id: 1 }]);
  assert.deepEqual(cached, [{ id: 1 }]);
  assert.equal(calls, 1);
});

test("serves the last successful response when Apps Script temporarily fails", async () => {
  let now = 1_000;
  let shouldFail = false;
  const source = createIncidentSource({
    now: () => now,
    fetchSource: async () => {
      if (shouldFail) throw new Error("Apps Script timeout");
      return [{ id: "latest" }];
    },
  });

  await source.load();
  now += 301_000;
  shouldFail = true;

  assert.deepEqual(await source.load(), [{ id: "latest" }]);
});

test("reuses the shared edge cache across isolated requests", async () => {
  let sharedCache = null;
  let calls = 0;
  const dependencies = {
    now: () => 1_000,
    readSharedCache: async () => sharedCache,
    writeSharedCache: async (entry) => {
      sharedCache = entry;
    },
    fetchSource: async () => {
      calls += 1;
      return [{ id: "edge-cached" }];
    },
  };

  const firstIsolate = createIncidentSource(dependencies);
  const secondIsolate = createIncidentSource(dependencies);

  assert.deepEqual(await firstIsolate.load(), [{ id: "edge-cached" }]);
  assert.deepEqual(await secondIsolate.load(), [{ id: "edge-cached" }]);
  assert.equal(calls, 1);
});

test("returns stale edge data immediately while refreshing Apps Script in the background", async () => {
  let sharedCache = { rows: [{ id: "stale" }], fetchedAt: 1_000 };
  let backgroundRefresh = null;
  const source = createIncidentSource({
    now: () => 302_000,
    readSharedCache: async () => sharedCache,
    writeSharedCache: async (entry) => {
      sharedCache = entry;
    },
    scheduleBackground: (promise) => {
      backgroundRefresh = promise;
    },
    fetchSource: async () => [{ id: "fresh" }],
  });

  assert.deepEqual(await source.load(), [{ id: "stale" }]);
  assert.ok(backgroundRefresh);
  await backgroundRefresh;
  assert.deepEqual(sharedCache.rows, [{ id: "fresh" }]);
});

test("falls back to Apps Script when the shared edge cache is unavailable", async () => {
  let calls = 0;
  const source = createIncidentSource({
    readSharedCache: async () => {
      throw new Error("Cache unavailable");
    },
    fetchSource: async () => {
      calls += 1;
      return [{ id: "upstream" }];
    },
  });

  assert.deepEqual(await source.load(), [{ id: "upstream" }]);
  assert.equal(calls, 1);
});

test("limits Apps Script records to the latest rolling three years", () => {
  const rows = [
    { id: "cutoff", date: "28/7/2023" },
    { id: "recent", date: "2026-07-28" },
    { id: "old", date: "27/7/2023" },
    { id: "invalid", date: "not-a-date" },
  ];

  assert.deepEqual(
    recentIncidentRows(rows, {
      now: Date.UTC(2026, 6, 28),
      years: 3,
    }).map((row) => row.id),
    ["cutoff", "recent"],
  );
});

test("rejects an Apps Script error payload instead of caching an empty result", () => {
  assert.throws(
    () => recentIncidentRows({ error: "Spreadsheet unavailable" }),
    /Invalid incidents response/,
  );
});

test("bounds cold Apps Script retries below the browser timeout", async () => {
  const route = await readFile(
    new URL("../app/api/incidents/route.ts", import.meta.url),
    "utf8",
  );

  assert.match(route, /fetchWithTimeoutRetry/);
  assert.match(route, /attempts:\s*2/);
  assert.match(route, /timeoutMs:\s*8_000/);
});
