import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = path.resolve(import.meta.dirname, "..");
const iconSvg = fs.readFileSync(path.join(root, "public", "icon.svg"), "utf8");
const favicon = fs.readFileSync(path.join(root, "public", "favicon.svg"), "utf8");
const manifest = fs.readFileSync(path.join(root, "app", "manifest.ts"), "utf8");
const layout = fs.readFileSync(path.join(root, "app", "layout.tsx"), "utf8");
const styles = fs.readFileSync(path.join(root, "app", "globals.css"), "utf8");

function pngSize(name) {
  const bytes = fs.readFileSync(path.join(root, "public", name));
  assert.deepEqual([...bytes.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
  return {
    width: bytes.readUInt32BE(16),
    height: bytes.readUInt32BE(20),
  };
}

test("PWA assets use the supplied Edge Soft image without recreating the mark", () => {
  assert.match(iconSvg, /<image[^>]+href=\"\/icon-512\.png\"/);
  assert.doesNotMatch(iconSvg, /<text/);
  assert.equal(favicon, iconSvg);
  assert.deepEqual(pngSize("icon-512.png"), { width: 512, height: 512 });
  assert.deepEqual(pngSize("icon-192.png"), { width: 192, height: 192 });
  assert.deepEqual(pngSize("icon-180.png"), { width: 180, height: 180 });
  assert.deepEqual(pngSize("apple-touch-icon-152.png"), { width: 152, height: 152 });
  assert.deepEqual(pngSize("apple-touch-icon-167.png"), { width: 167, height: 167 });
  assert.deepEqual(pngSize("maskable-192.png"), { width: 192, height: 192 });
  assert.deepEqual(pngSize("maskable-512.png"), { width: 512, height: 512 });
  assert.deepEqual(pngSize("mstile-150.png"), { width: 150, height: 150 });
});

test("manifest exposes PNG install icons for Windows, Android, and iOS", () => {
  assert.match(manifest, /display:\s*\"standalone\"/);
  assert.match(manifest, /orientation:\s*\"any\"/);
  assert.match(manifest, /src:\s*\"\/icon-192\.png\"/);
  assert.match(manifest, /src:\s*\"\/icon-512\.png\"/);
  assert.match(manifest, /src:\s*\"\/maskable-192\.png\"/);
  assert.match(manifest, /src:\s*\"\/maskable-512\.png\"/);
  assert.match(manifest, /purpose:\s*\"maskable\"/);
});

test("layout points browsers and install prompts at the supplied image assets", () => {
  assert.match(layout, /icon:\s*\"\/icon-192\.png\"/);
  assert.match(layout, /apple:\s*\"\/icon-180\.png\"/);
  assert.match(layout, /manifest:\s*\"\/manifest\.webmanifest\"/);
  assert.match(layout, /favicon\.ico/);
  assert.match(layout, /browserconfig\.xml/);
});

test("favicon and Windows browser configuration are installable", () => {
  const faviconIco = fs.readFileSync(path.join(root, "public", "favicon.ico"));
  const browserConfig = fs.readFileSync(path.join(root, "public", "browserconfig.xml"), "utf8");

  assert.deepEqual([...faviconIco.subarray(0, 4)], [0, 0, 1, 0]);
  assert.match(browserConfig, /mstile-150\.png/);
});

test("mobile layout accounts for safe areas and narrow screens", () => {
  assert.match(layout, /viewportFit:\s*\"cover\"/);
  assert.match(styles, /safe-area-inset-top/);
  assert.match(styles, /safe-area-inset-bottom/);
  assert.match(styles, /@media \(max-width: 600px\)/);
});
