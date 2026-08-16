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

test("redirects the root route to the supplied Skeuomorph dashboard", async () => {
  const response = await render();
  assert.ok([307, 308].includes(response.status));
  assert.equal(
    new URL(response.headers.get("location"), "http://localhost").pathname,
    "/IT-Call-Skeuomorph.html",
  );
});

test("keeps the supplied dashboard content and routes data through the edge API", async () => {
  const [dashboard, appScript] = await Promise.all([
    readFile(
      new URL("../public/IT-Call-Skeuomorph.html", import.meta.url),
      "utf8",
    ),
    readFile(new URL("../public/js/app.js", import.meta.url), "utf8"),
  ]);

  assert.match(dashboard, /IT Call Center Analytics/);
  assert.match(dashboard, /สรุปยอดภาระงานรายบุคคล/);
  assert.match(dashboard, /รายละเอียดปัญหา/);
  assert.match(dashboard, /รายการแจ้งปัญหา \(Log\)/);
  assert.match(appScript, /url:\s*'\/api\/incidents'/);
  assert.match(appScript, /timeoutMs:\s*50_000/);
  assert.match(appScript, /fetchJsonWithRetry\(API_CONFIG\.url/);
  assert.match(dashboard, /Chart\.js|chart\.umd\.min\.js/);
  assert.match(dashboard, /width=device-width, initial-scale=1\.0/);
  assert.match(dashboard, /id="themePanelToggle"/);
  assert.match(dashboard, /id="cardThemePreview"/);
  assert.match(dashboard, /data-theme="theme-netflix"/);
});

test("keeps CSV export UTF-8 and incident details", async () => {
  const appScript = await readFile(
    new URL("../public/js/app.js", import.meta.url),
    "utf8",
  );

  assert.match(appScript, /let csvContent = "\\uFEFF"/);
  assert.match(appScript, /row\.detail/);
});

test("removes the temporary starter preview infrastructure", async () => {
  const [page, layout, packageJson] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  assert.match(page, /redirect\("\/IT-Call-Skeuomorph\.html"\)/);
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
