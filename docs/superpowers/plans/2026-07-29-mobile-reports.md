# Mobile Reports Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** ทำให้ส่วนสรุป HR และ Log ใช้งานบนมือถือได้เต็มความกว้างโดยไม่มี horizontal overflow พร้อมแยก markup, CSS และการเรนเดอร์มือถือจากเดสก์ท็อป

**Architecture:** เก็บข้อมูลต้นทางและตัวกรองชุดเดิม แล้วแปลงข้อมูลเป็น view model ผ่านโมดูล `mobile-reports.mjs` ก่อนเรนเดอร์ลง container มือถือโดยเฉพาะ ตารางเดสก์ท็อปและการคำนวณเดิมยังคงอยู่ โดย media query ที่ 600 พิกเซลสลับการแสดงผลระหว่างสองเลย์เอาต์

**Tech Stack:** HTML, CSS, browser ES modules, Node.js test runner, vinext, Sites

## Global Constraints

- รองรับหน้าจอกว้าง 320 พิกเซลขึ้นไปโดยไม่มี horizontal overflow
- จุดเปลี่ยนเลย์เอาต์มือถือคือ `@media (max-width: 600px)`
- เดสก์ท็อปต้องคงตารางและพฤติกรรมเดิม
- มือถือต้องแสดงข้อมูล HR และ Log ครบโดยไม่ต้องเลื่อนแนวนอน
- ใช้ข้อมูล ตัวกรอง การค้นหา และ pagination ชุดเดียวกันกับเดสก์ท็อป
- ไม่เพิ่ม dependency ใหม่

---

### Task 1: Mobile report view models

**Files:**
- Create: `public/mobile-reports.mjs`
- Create: `tests/mobile-reports.test.mjs`

**Interfaces:**
- Produces: `buildMobileHrRows(staffCounts: Record<string, number>, totalTickets: number): MobileHrRow[]`
- Produces: `buildMobileLogRows(records: object[]): MobileLogRow[]`
- `MobileHrRow`: `{ rank, name, initial, count, percentage, percentageLabel }`
- `MobileLogRow`: `{ date, time, detail, type, department, operator, operatorInitial }`

- [ ] **Step 1: Write the failing view-model tests**

```js
assert.deepEqual(buildMobileHrRows({ อธิบดี: 3, กรพีร์วัศ: 2 }, 5), [
  { rank: 1, name: "อธิบดี", initial: "อ", count: 3, percentage: 60, percentageLabel: "60.0%" },
  { rank: 2, name: "กรพีร์วัศ", initial: "ก", count: 2, percentage: 40, percentageLabel: "40.0%" },
]);

assert.deepEqual(buildMobileLogRows([{ date: "23/7/2026", time: "20:19:00", detail: "", type: "ทั่วไป", dept: "ER", operator: "อธิบดี" }])[0], {
  date: "23/7/2026",
  time: "20:19:00",
  detail: "ไม่มีรายละเอียด",
  type: "ทั่วไป",
  department: "ER",
  operator: "อธิบดี",
  operatorInitial: "อ",
});
```

- [ ] **Step 2: Run the new test and verify RED**

Run: `node --test tests/mobile-reports.test.mjs`

Expected: FAIL because `public/mobile-reports.mjs` does not exist.

- [ ] **Step 3: Implement the minimal pure data helpers**

```js
export function buildMobileHrRows(staffCounts, totalTickets) {
  return Object.entries(staffCounts)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "th"))
    .map(([name, count], index) => {
      const percentage = totalTickets > 0 ? (count / totalTickets) * 100 : 0;
      return {
        rank: index + 1,
        name,
        initial: name.charAt(0) || "?",
        count,
        percentage,
        percentageLabel: `${percentage.toFixed(1)}%`,
      };
    });
}

export function buildMobileLogRows(records) {
  return records.map((record) => ({
    date: String(record.date || "-"),
    time: String(record.time || "-"),
    detail: String(record.detail || "").trim() || "ไม่มีรายละเอียด",
    type: String(record.type || "-"),
    department: String(record.dept || "-"),
    operator: String(record.operator || "-"),
    operatorInitial: String(record.operator || "-").charAt(0) || "?",
  }));
}
```

- [ ] **Step 4: Run the test and verify GREEN**

Run: `node --test tests/mobile-reports.test.mjs`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add public/mobile-reports.mjs tests/mobile-reports.test.mjs
git commit -m "Add mobile report view models"
```

### Task 2: Separate mobile HR presentation

**Files:**
- Modify: `public/IT-Call-Skeuomorph.html`
- Modify: `tests/mobile-reports.test.mjs`

**Interfaces:**
- Consumes: `buildMobileHrRows(getStaffCounts(data), data.length)`
- Produces: `renderMobileHRReport(data)` and container `#mobileHrList`

- [ ] **Step 1: Add failing source-contract assertions**

```js
assert.match(page, /class="desktop-hr-table"/);
assert.match(page, /id="mobileHrList"/);
assert.match(page, /function renderMobileHRReport\(data\)/);
assert.match(page, /\.mobile-hr-list/);
assert.match(page, /overflow-wrap:\s*anywhere/);
```

- [ ] **Step 2: Run the test and verify RED**

Run: `node --test tests/mobile-reports.test.mjs`

Expected: FAIL because the dedicated HR mobile markup and renderer are absent.

- [ ] **Step 3: Add separate HR mobile markup and renderer**

Add a desktop wrapper class to the existing table, create a semantic mobile list with `id="mobileHrList"`, and import:

```js
import { buildMobileHrRows, buildMobileLogRows } from "/mobile-reports.mjs";
```

Call `renderMobileHRReport(data)` from `renderHRReport(data)`. Each list row must set a full accessible label:

```js
article.setAttribute(
  "aria-label",
  `อันดับ ${row.rank} ${row.name} ${row.count} Ticket ${row.percentageLabel}`,
);
```

- [ ] **Step 4: Add mobile-only HR CSS**

Within `@media (max-width: 600px)`, hide `.desktop-hr-table`, show `.mobile-hr-list`, use `min-width: 0`, `overflow-wrap: anywhere`, compact padding, full-width buttons, and no horizontal scrolling.

- [ ] **Step 5: Run the focused test and verify GREEN**

Run: `node --test tests/mobile-reports.test.mjs`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add public/IT-Call-Skeuomorph.html tests/mobile-reports.test.mjs
git commit -m "Add dedicated mobile HR summary"
```

### Task 3: Separate mobile Log presentation

**Files:**
- Modify: `public/IT-Call-Skeuomorph.html`
- Modify: `tests/mobile-reports.test.mjs`

**Interfaces:**
- Consumes: `buildMobileLogRows(displayData)`
- Produces: `renderMobileLogRows(displayData)` and container `#mobileLogList`
- Reuses: `renderPagination(data.length)`

- [ ] **Step 1: Add failing Log source-contract assertions**

```js
assert.match(page, /class="desktop-log-table"/);
assert.match(page, /id="mobileLogList"/);
assert.match(page, /function renderMobileLogRows\(records\)/);
assert.match(page, /\.mobile-log-card/);
assert.match(page, /\.mobile-log-detail/);
```

- [ ] **Step 2: Run the test and verify RED**

Run: `node --test tests/mobile-reports.test.mjs`

Expected: FAIL because the dedicated Log mobile markup and renderer are absent.

- [ ] **Step 3: Add the separate Log list and renderer**

Create `#mobileLogList` next to the desktop table. In `renderTable`, clear both containers, pass the current paginated `displayData` to `renderMobileLogRows`, and render:

```html
<article class="mobile-log-card">
  <header>วันที่และเวลา</header>
  <p class="mobile-log-detail">รายละเอียดปัญหา</p>
  <dl>ประเภท แผนก ผู้ปฏิบัติงาน</dl>
</article>
```

The empty state must be rendered in both layouts.

- [ ] **Step 4: Add mobile-only filter and Log CSS**

At no more than 600 pixels, hide `.desktop-log-table`, show `.mobile-log-list`, set the filter controls and action button to full width, allow detail text to wrap, and set all card children to `min-width: 0`.

- [ ] **Step 5: Run the focused test and verify GREEN**

Run: `node --test tests/mobile-reports.test.mjs`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add public/IT-Call-Skeuomorph.html tests/mobile-reports.test.mjs
git commit -m "Add dedicated mobile operation log"
```

### Task 4: Regression, visual QA, and publication

**Files:**
- Verify: `public/IT-Call-Skeuomorph.html`
- Verify: `public/mobile-reports.mjs`
- Verify: `tests/mobile-reports.test.mjs`

**Interfaces:**
- Consumes: completed mobile HR and Log presentation
- Produces: deployed Sites version

- [ ] **Step 1: Run the full verification**

Run:

```bash
npm run build
node --test tests/*.test.mjs
npm run lint
git diff --check
```

Expected: build exits 0, all tests pass, lint exits 0, and `git diff --check` returns no output.

- [ ] **Step 2: Verify mobile behavior in the browser**

At 320×800, 360×800, and 390×844 verify:

- `document.documentElement.scrollWidth <= innerWidth`
- desktop HR and Log tables are hidden
- mobile HR and Log lists are visible
- HR names/counts and Log detail/type/department/operator are present
- filters update both desktop and mobile render targets
- pagination changes the mobile Log records

- [ ] **Step 3: Verify desktop behavior**

At 1280×800 verify desktop tables are visible, mobile lists are hidden, and no report data is lost.

- [ ] **Step 4: Commit any final verified adjustments**

```bash
git add public/IT-Call-Skeuomorph.html public/mobile-reports.mjs tests/mobile-reports.test.mjs
git commit -m "Polish mobile report layouts"
```

Skip this commit when there are no post-QA changes.

- [ ] **Step 5: Publish the exact verified commit**

Push the current branch head, package the successful build, save one Sites version, deploy it to the existing project, and poll until the deployment reports success.

- [ ] **Step 6: Verify production**

Open the production URL at 390×844 and repeat the overflow, visibility, content, filter, and pagination checks before reporting completion.
