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

test("iPad Home Screen metadata provides PNG touch icons and a manifest", () => {
  const layout = readFileSync(new URL("../app/layout.tsx", import.meta.url), "utf8");
  const manifest = JSON.parse(readFileSync(new URL("../public/manifest.webmanifest", import.meta.url), "utf8"));
  const touchIcon = readFileSync(new URL("../public/apple-touch-icon.png", import.meta.url));

  assert.match(layout, /apple:\s*"\/apple-touch-icon\.png"/);
  assert.match(layout, /manifest:\s*"\/manifest\.webmanifest"/);
  assert.equal(touchIcon.readUInt32BE(16), 180);
  assert.equal(touchIcon.readUInt32BE(20), 180);
  assert.deepEqual(manifest.icons.map(({ src, sizes }) => [src, sizes]), [
    ["/icon-192.png", "192x192"],
    ["/icon-512.png", "512x512"],
    ["/icon-1024.png", "1024x1024"],
  ]);
  const androidIcon = readFileSync(new URL("../public/icon-1024.png", import.meta.url));
  assert.equal(androidIcon.readUInt32BE(16), 1024);
  assert.equal(androidIcon.readUInt32BE(20), 1024);
});
