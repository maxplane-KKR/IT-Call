import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { inflateSync } from "node:zlib";

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

function pngCornerAlphas(name) {
  const bytes = fs.readFileSync(path.join(root, "public", name));
  const width = bytes.readUInt32BE(16);
  const height = bytes.readUInt32BE(20);

  assert.equal(bytes[24], 8, `${name} must use 8-bit channels`);
  assert.equal(bytes[25], 6, `${name} must use RGBA pixels`);
  assert.equal(bytes[28], 0, `${name} must not be interlaced`);

  const idatChunks = [];
  for (let offset = 8; offset < bytes.length; ) {
    const length = bytes.readUInt32BE(offset);
    const type = bytes.toString("ascii", offset + 4, offset + 8);
    if (type === "IDAT") {
      idatChunks.push(bytes.subarray(offset + 8, offset + 8 + length));
    }
    offset += length + 12;
  }

  const inflated = inflateSync(Buffer.concat(idatChunks));
  const stride = width * 4;
  let sourceOffset = 0;
  let previous = Buffer.alloc(stride);
  let top;
  let bottom;

  for (let y = 0; y < height; y += 1) {
    const filter = inflated[sourceOffset];
    sourceOffset += 1;
    const current = Buffer.alloc(stride);

    for (let x = 0; x < stride; x += 1) {
      const raw = inflated[sourceOffset + x];
      const left = x >= 4 ? current[x - 4] : 0;
      const up = previous[x];
      const upperLeft = x >= 4 ? previous[x - 4] : 0;
      let value;

      if (filter === 0) value = raw;
      else if (filter === 1) value = raw + left;
      else if (filter === 2) value = raw + up;
      else if (filter === 3) value = raw + Math.floor((left + up) / 2);
      else if (filter === 4) {
        const estimate = left + up - upperLeft;
        const leftDistance = Math.abs(estimate - left);
        const upDistance = Math.abs(estimate - up);
        const upperLeftDistance = Math.abs(estimate - upperLeft);
        const predictor =
          leftDistance <= upDistance && leftDistance <= upperLeftDistance
            ? left
            : upDistance <= upperLeftDistance
              ? up
              : upperLeft;
        value = raw + predictor;
      } else {
        assert.fail(`${name} uses unsupported PNG filter ${filter}`);
      }

      current[x] = value & 0xff;
    }

    if (y === 0) top = current;
    if (y === height - 1) bottom = current;
    previous = current;
    sourceOffset += stride;
  }

  return [top[3], top[stride - 1], bottom[3], bottom[stride - 1]];
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

test("Windows install icons have transparent corners while Android maskable icons stay full bleed", () => {
  for (const name of ["icon-96.png", "icon-192.png", "icon-512.png"]) {
    assert.deepEqual(pngCornerAlphas(name), [0, 0, 0, 0], `${name} should render as a circle on Windows`);
  }

  for (const name of ["maskable-192.png", "maskable-512.png"]) {
    assert.deepEqual(pngCornerAlphas(name), [255, 255, 255, 255], `${name} should stay full bleed on Android`);
  }
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
