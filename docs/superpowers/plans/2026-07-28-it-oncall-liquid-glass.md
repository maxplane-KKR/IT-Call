# IT On-call Liquid Glass Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a local-only reconstruction of the IT On-call Compensation Dashboard with a dark Liquid Glass visual system, derived sample-data metrics, responsive desktop/mobile layouts, and accessible interactions.

**Architecture:** Use the bundled vinext starter in the existing workspace. Keep one focused client page in `app/page.tsx`, one stylesheet in `app/globals.css`, and a dependency-free local data module in `lib/dashboard-data.mjs` so derived behavior can be tested with Node's built-in test runner. Remove the temporary starter preview infrastructure and keep `.openai/hosting.json` intact for a future publish decision.

**Tech Stack:** React 19, Next-compatible vinext, TypeScript for the page/layout, CSS with native responsive media queries, Node `node:test` for data behavior, and the existing Sites starter scripts.

## Global Constraints

- Local preview only; do not call Sites save/deploy tools or publish a production version.
- Use local sample data and label the preview as a local reconstruction; do not imply a production data connection.
- Preserve the existing content model: status, rate cards, filters, five KPIs, four analyses, event records, access notice, and CSV export.
- Use Liquid Glass consistently: deep navy canvas, translucent surfaces, restrained blur, thin borders, accessible contrast.
- Support 375px, 768px, 1024px, and 1440px layouts with no horizontal page scroll.
- Keep interactive hit areas at least 44px, provide visible focus states, use semantic labels, and respect `prefers-reduced-motion`.
- Do not use emoji as structural icons and do not add a chart dependency for the local preview.
- Keep the dev server alive through implementation and browser verification.

### Task 1: Initialize the local Sites surface

**Files:**
- Create: starter files generated in the workspace by `C:\Users\Theboy-AsusTUF\.codex\plugins\cache\openai-bundled\sites\0.1.31\scripts\init-site.sh`
- Preserve: `.openai/hosting.json`

- [ ] **Step 1: Run the bundled initializer from the existing workspace**

Run:

```powershell
& 'C:\Users\Theboy-AsusTUF\.codex\plugins\cache\openai-bundled\sites\0.1.31\scripts\init-site.sh' 'C:\Users\Theboy-AsusTUF\Documents\Codex\2026-07-28\it-on-call-compensation-dashboard-sites'
```

Expected: the vinext starter and lockfile are created in the current workspace without changing the project ID in `.openai/hosting.json`.

- [ ] **Step 2: Verify the starter surface and install state**

Run:

```powershell
Get-ChildItem -Force
Get-ChildItem -Recurse -File app,tests | Select-Object FullName
npm run build
```

Expected: the starter build exits 0 and the expected `app/page.tsx`, `app/layout.tsx`, `app/globals.css`, and `tests/rendered-html.test.mjs` files exist.

- [ ] **Step 3: Start the retained local dev server**

Run in a retained foreground session:

```powershell
npm run dev
```

Expected: the terminal prints one healthy local URL that will be reused for browser preview.

### Task 2: Add tested sample-data derivation

**Files:**
- Create: `tests/dashboard-data.test.mjs`
- Create: `lib/dashboard-data.mjs`

**Interfaces:**
- `sampleRecords`: array of local event records used by the page.
- `filterRecords(records, filters)`: returns records matching month, operator, event type, and department.
- `summarizeRecords(records)`: returns the five KPI values and analysis-ready grouped values.
- `toCsv(records)`: returns a CSV string with a header and one row per visible record.

- [ ] **Step 1: Write the failing data behavior tests**

Create `tests/dashboard-data.test.mjs` with these behaviors:

```js
import assert from "node:assert/strict";
import test from "node:test";
import {
  filterRecords,
  sampleRecords,
  summarizeRecords,
  toCsv,
} from "../lib/dashboard-data.mjs";

test("filters records by operator and event type", () => {
  const result = filterRecords(sampleRecords, {
    month: "ทั้งหมด",
    operator: "เมธา",
    eventType: "Tele",
    department: "ทั้งหมด",
  });

  assert.ok(result.length > 0);
  assert.ok(result.every((record) => record.operator === "เมธา" && record.eventType === "Tele"));
});

test("summarizes compensation, shifts, and event counts from visible records", () => {
  const summary = summarizeRecords(sampleRecords);

  assert.equal(summary.shifts, sampleRecords.length);
  assert.equal(summary.teleEvents + summary.generalEvents, sampleRecords.length);
  assert.ok(summary.paidCompensation > 0);
  assert.ok(summary.byOperator.length > 0);
  assert.ok(summary.byEventType.length > 0);
});

test("exports visible records as a CSV with a header", () => {
  const csv = toCsv(sampleRecords.slice(0, 2));

  assert.match(csv, /^วันที่,ผู้ปฏิบัติงาน,แผนก,ประเภทเหตุการณ์/);
  assert.equal(csv.trim().split("\\n").length, 3);
});
```

- [ ] **Step 2: Run the focused test to verify it fails for the missing module**

Run:

```powershell
node --test tests/dashboard-data.test.mjs
```

Expected: FAIL with a module-not-found error for `lib/dashboard-data.mjs`.

- [ ] **Step 3: Implement the minimal local data module**

Create `lib/dashboard-data.mjs` with:

- 8-10 realistic Thai sample records spanning at least two months, three operators, two departments, and both `Tele` and `ทั่วไป` event types.
- Each record shaped as `{ id, date, time, month, operator, department, eventType, severity, durationMinutes, compensation, capped }`.
- `filterRecords` using exact selected values and treating `ทั้งหมด` as a wildcard.
- `summarizeRecords` returning `paidCompensation`, `shifts`, `teleEvents`, `generalEvents`, `cappedAmount`, `byOperator`, `byEventType`, `byHour`, and `caseShare`.
- `toCsv` escaping commas, quotes, and line breaks so exported local data remains valid CSV.

- [ ] **Step 4: Run the focused test to verify it passes**

Run:

```powershell
node --test tests/dashboard-data.test.mjs
```

Expected: all three data tests pass with zero failures.

### Task 3: Replace starter output with the dashboard page

**Files:**
- Modify: `tests/rendered-html.test.mjs`
- Modify: `app/page.tsx`
- Modify: `app/globals.css`
- Modify: `app/layout.tsx`
- Delete: `app/_sites-preview/SkeletonPreview.tsx`
- Delete: `app/_sites-preview/preview.css`

- [ ] **Step 1: Change the rendered HTML test to describe the finished page**

Replace starter assertions with checks for:

```js
assert.doesNotMatch(html, /codex-preview|Your site is taking shape|react-loading-skeleton/i);
assert.match(html, /IT On-call/i);
assert.match(html, /ยอดค่าตอบแทนที่จ่ายจริง/);
assert.match(html, /ตัวกรองแดชบอร์ด/);
assert.match(html, /รายการเหตุการณ์/);
assert.match(html, /role="main"/i);
```

- [ ] **Step 2: Run the render test to verify it fails against the starter**

Run:

```powershell
npm run build
node --test tests/rendered-html.test.mjs
```

Expected: the build passes, then the render test fails because the starter still renders its loading skeleton and starter metadata.

- [ ] **Step 3: Implement the page structure and interactions**

Implement `app/page.tsx` as a client component that:

- imports `sampleRecords`, `filterRecords`, `summarizeRecords`, and `toCsv`;
- stores four filter values, refresh state, last-updated text, and export errors;
- derives visible records and summary values with `useMemo`;
- renders semantic `main`, `header`, `section`, `article`, `table`, `caption`, `thead`, `tbody`, `label`, `select`, and `button` elements;
- renders status, rate tiles, four labeled filters, five KPI cards, four analysis panels, and the event log;
- switches the event table to stacked record cards through CSS at mobile widths;
- provides a reset-filters action when any filter is active;
- simulates update feedback with a short timeout and updates last-updated text;
- creates a local CSV `Blob` and triggers a download from the visible records;
- shows a clear empty state when the current filters match no records;
- adds `aria-live="polite"` to refresh/export feedback and descriptive button labels.

- [ ] **Step 4: Implement the Liquid Glass design system**

Replace `app/globals.css` with token-driven styles that include:

- deep navy canvas, atmosphere gradients, and a max-width dashboard frame;
- translucent glass panels with border, blur, and low shadow;
- Fira Sans/Fira Code font loading with system fallbacks and `font-display: swap`;
- responsive grid rules for 375px, 768px, 1024px, and 1440px;
- visible focus rings, pointer cursors, pressed/hover states, and 44px controls;
- CSS bar/donut-like analysis visuals that use labels and text summaries;
- mobile event-card layout with no horizontal overflow;
- `@media (prefers-reduced-motion: reduce)` disabling transform/entrance motion;
- `min-height: 100dvh`, safe padding, and a consistent z-index scale.

- [ ] **Step 5: Replace starter metadata and remove starter preview references**

Update `app/layout.tsx` metadata to:

```ts
export const metadata: Metadata = {
  title: "IT On-call Compensation Desk",
  description: "Local preview of the IT on-call compensation dashboard.",
};
```

Remove the `codex-preview` meta marker, remove `_sites-preview` imports, and remove `react-loading-skeleton` from `package.json` if no remaining file imports it. Refresh the lockfile with the existing package manager.

- [ ] **Step 6: Run both test suites to verify the implementation passes**

Run:

```powershell
node --test tests/dashboard-data.test.mjs
npm test
```

Expected: the focused data tests and the build/render suite pass with zero failures and no starter skeleton assertions remain.

### Task 4: Browser verification and local handoff

**Files:**
- Modify: `app/page.tsx` or `app/globals.css` only when a verification finding requires a targeted fix

- [ ] **Step 1: Build while the dev server remains alive**

Run:

```powershell
npm run build
```

Expected: exit code 0 with a deployable vinext build and no TypeScript/build errors.

- [ ] **Step 2: Verify the desktop local preview**

Open the exact local URL in the in-app browser and check at 1440px and 1024px:

- hero/status and rate tiles are visible without clipping;
- all four filters have labels and update the visible records/KPIs;
- five KPI cards and four analysis panels are readable;
- event records include access notice and CSV action;
- update feedback changes state and returns to enabled;
- keyboard focus is visible on filters, reset, update, and CSV controls.

- [ ] **Step 3: Verify the mobile local preview**

Set the browser viewport to 768px and 375px and check:

- no horizontal document overflow;
- controls remain at least 44px tall;
- KPI cards remain readable in two columns;
- analysis panels stack in the specified priority order;
- event rows become cards without losing fields;
- the reset and CSV actions remain reachable without hover.

- [ ] **Step 4: Verify reduced motion and empty state**

Use the browser/page state to select a filter combination with no records, confirm the empty state and reset action, then verify the page remains usable when reduced motion is enabled.

- [ ] **Step 5: Hand off the local preview**

Keep the healthy dev server running and report the local URL plus the tested viewport sizes. Do not save a Sites version or deploy production in this phase.
