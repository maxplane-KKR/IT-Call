import { readFileSync } from "node:fs";
import { test } from "node:test";
import assert from "node:assert/strict";

test("favicon uses the selected headset concept and exact IT On-call label", () => {
  const svg = readFileSync(new URL("../public/favicon.svg", import.meta.url), "utf8");

  assert.match(svg, /aria-label="IT On-call"/);
  assert.match(svg, /<text[^>]*>IT On-call<\/text>/);
  assert.match(svg, /data-icon="headset"/);
  assert.match(svg, /viewBox="0 0 512 512"/);
});
