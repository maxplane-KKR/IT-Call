import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the IT on-call dashboard surface", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape|react-loading-skeleton/i);
  assert.match(html, /IT On-call/i);
  assert.match(html, /ยอดค่าตอบแทนที่จ่ายจริง/);
  assert.match(html, /ตัวกรองแดชบอร์ด/);
  assert.match(html, /รายการเหตุการณ์/);
  assert.match(html, /theme-toggle/);
  assert.match(html, /aria-pressed/);
  assert.match(html, /<main\b/i);
});

test("removes the temporary starter preview infrastructure", async () => {
  const [page, layout, packageJson] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  assert.match(page, /IT\s*<span>On-call<\/span>/);
  assert.doesNotMatch(page, /SkeletonPreview|codex-preview|_sites-preview/);
  assert.match(layout, /IT On-call Compensation Desk/);
  assert.doesNotMatch(layout, /Starter Project|codex-preview|_sites-preview/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
  const previewDirectory = await readdir(
    new URL("../app/_sites-preview/", import.meta.url),
  ).catch((error) => {
    if (error?.code === "ENOENT") return [];
    throw error;
  });
  assert.deepEqual(previewDirectory, []);
});

test("removes the access notice card from the operation log", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");

  assert.doesNotMatch(page, /access-notice|ข้อมูลจำกัดสิทธิ์|notice-mark/);
});

test("uses neutral copy for the live data status", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");

  assert.doesNotMatch(page, /เวอร์ชันก่อน/);
  assert.match(page, /ข้อมูลปฏิบัติการล่าสุด/);
});

test("removes compensation from operation log entries", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");

  assert.doesNotMatch(page, /<th scope="col">ค่าตอบแทน<\/th>|record\.compensation/);
});

test("adds a UTF-8 BOM when downloading CSV", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");

  assert.match(page, /new Blob\(\["\\uFEFF", toCsv\(visibleRecords\)\]/);
});

test("removes the source disclosure footer label", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");

  assert.doesNotMatch(page, /LIVE SOURCE \/ PREVIOUS VERSION DATA/);
});
