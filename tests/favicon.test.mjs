import { readFileSync } from "node:fs";
import { test } from "node:test";
import assert from "node:assert/strict";

test("favicon uses the selected circular Editorial stack concept", () => {
  const svg = readFileSync(new URL("../public/favicon.svg", import.meta.url), "utf8");

  assert.match(svg, /aria-label="IT On-call"/);
  assert.match(svg, /data-icon="editorial-stack"/);
  assert.match(svg, /<circle[^>]*cx="256"[^>]*cy="256"[^>]*r="256"/);
  assert.match(svg, /<text[^>]*>IT<\/text>/);
  assert.match(svg, /<text[^>]*>\/<\/text>/);
  assert.match(svg, /<text[^>]*>ON-CALL<\/text>/);
  assert.doesNotMatch(svg, /data-icon="headset"/);
  assert.match(svg, /viewBox="0 0 512 512"/);
});

test("cross-platform metadata provides versioned icons for Windows, iPad, and mobile", () => {
  const layout = readFileSync(new URL("../app/layout.tsx", import.meta.url), "utf8");
  const manifest = JSON.parse(readFileSync(new URL("../public/manifest-v2.webmanifest", import.meta.url), "utf8"));
  const touchIcon = readFileSync(new URL("../public/apple-touch-icon-v2.png", import.meta.url));

  assert.match(layout, /icon:\s*"\/favicon-v3\.ico"/);
  assert.match(layout, /shortcut:\s*"\/favicon-v3\.ico"/);
  assert.match(layout, /apple:\s*"\/apple-touch-icon-v2\.png"/);
  assert.match(layout, /manifest:\s*"\/manifest-v2\.webmanifest"/);
  assert.equal(touchIcon.readUInt32BE(16), 180);
  assert.equal(touchIcon.readUInt32BE(20), 180);
  assert.deepEqual(manifest.icons.map(({ src, sizes }) => [src, sizes]), [
    ["/icon-192-v2.png", "192x192"],
    ["/icon-512-v2.png", "512x512"],
    ["/icon-1024-v2.png", "1024x1024"],
  ]);
  const mobileIcon192 = readFileSync(new URL("../public/icon-192-v2.png", import.meta.url));
  const mobileIcon512 = readFileSync(new URL("../public/icon-512-v2.png", import.meta.url));
  const androidIcon = readFileSync(new URL("../public/icon-1024-v2.png", import.meta.url));
  assert.equal(mobileIcon192.readUInt32BE(16), 192);
  assert.equal(mobileIcon192.readUInt32BE(20), 192);
  assert.equal(mobileIcon512.readUInt32BE(16), 512);
  assert.equal(mobileIcon512.readUInt32BE(20), 512);
  assert.equal(androidIcon.readUInt32BE(16), 1024);
  assert.equal(androidIcon.readUInt32BE(20), 1024);
});

test("Windows desktop icon is a versioned multi-size ICO", () => {
  const ico = readFileSync(new URL("../public/favicon-v3.ico", import.meta.url));

  assert.equal(ico.readUInt16LE(0), 0);
  assert.equal(ico.readUInt16LE(2), 1);
  assert.equal(ico.readUInt16LE(4), 4);
  assert.deepEqual(
    Array.from({ length: 4 }, (_, index) => ico[index * 16 + 6] || 256),
    [16, 32, 48, 256],
  );
  for (let index = 0; index < 4; index += 1) {
    const entry = 6 + index * 16;
    const offset = ico.readUInt32LE(entry + 12);
    assert.equal(ico.subarray(offset, offset + 8).toString("hex"), "89504e470d0a1a0a");
  }
});
