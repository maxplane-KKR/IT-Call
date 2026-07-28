import assert from "node:assert/strict";
import test from "node:test";
import { createIncidentSource } from "../lib/incidents-source.mjs";

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
