# Mobile Metric Strip Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** แยกการ์ดตัวชี้วัดมือถือ 4 ใบให้อยู่แถวเดียวและพอดีหน้าจอตั้งแต่ 320 พิกเซลโดยไม่เลื่อนแนวนอน พร้อมคงการ์ด desktop เดิม

**Architecture:** เก็บ desktop metric grid เดิมไว้และเพิ่ม mobile-only metric strip ในไฟล์ HTML เดียวกัน โดยใช้ media query ที่ 600 พิกเซลเป็นตัวสลับชุดแสดงผล JavaScript helper เดียวอัปเดตค่าคู่ desktop/mobile เพื่อไม่ให้ข้อมูลสองชุดคลาดเคลื่อน

**Tech Stack:** HTML5, Tailwind CDN utilities, responsive CSS, vanilla JavaScript, Node.js test runner, vinext, Sites

## Global Constraints

- ชุด desktop ต้องไม่เปลี่ยนหน้าตาหรือพฤติกรรม
- ชุด mobile แสดงเฉพาะหน้าจอกว้างไม่เกิน 600 พิกเซล
- การ์ดมือถือใช้ `grid-template-columns: repeat(4, minmax(0, 1fr))`
- หน้าเว็บต้องไม่มี page-level horizontal overflow ที่ 320, 360 และ 390 พิกเซล
- ค่าที่ยาวต้องอยู่บรรทัดเดียว ตัดด้วย ellipsis และมี `title` กับ accessible label ที่เก็บค่าเต็ม
- ไม่เปลี่ยน API, Apps Script, สูตรคำนวณ, กราฟ, ตาราง หรือรายงาน HR

---

### Task 1: Add mobile metric strip regression coverage

**Files:**
- Create: `tests/mobile-metric-strip.test.mjs`
- Read: `public/IT-Call-Skeuomorph.html`

**Interfaces:**
- Consumes: HTML source from `public/IT-Call-Skeuomorph.html`
- Produces: regression contract for `.desktop-metric-grid`, `.mobile-metric-strip`, four mobile metric values, mobile CSS breakpoint, and paired JavaScript updates

- [ ] **Step 1: Write the failing regression test**

```js
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const html = await readFile(
  new URL("../public/IT-Call-Skeuomorph.html", import.meta.url),
  "utf8",
);

test("renders a dedicated four-column mobile metric strip", () => {
  assert.match(html, /class="[^"]*desktop-metric-grid/);
  assert.match(html, /class="mobile-metric-strip"/);
  assert.equal((html.match(/class="mobile-metric-card /g) ?? []).length, 4);
  assert.match(html, /id="mobileTotalTickets"/);
  assert.match(html, /id="mobileTopDept"/);
  assert.match(html, /id="mobileTopStaff"/);
  assert.match(html, /id="mobileApiStatus"/);
});

test("keeps all mobile metrics in one non-scrolling row", () => {
  assert.match(html, /@media\s*\(max-width:\s*600px\)/);
  assert.match(
    html,
    /\.mobile-metric-strip\s*\{[^}]*grid-template-columns:\s*repeat\(4,\s*minmax\(0,\s*1fr\)\)/s,
  );
  assert.match(html, /\.mobile-metric-value\s*\{[^}]*text-overflow:\s*ellipsis/s);
  assert.doesNotMatch(html, /\.mobile-metric-strip\s*\{[^}]*overflow-x:\s*(auto|scroll)/s);
});

test("updates desktop and mobile metric values together", () => {
  assert.match(html, /function setMetricPair\(/);
  assert.match(html, /setMetricPair\('totalTickets', 'mobileTotalTickets'/);
  assert.match(html, /setMetricPair\('topDept', 'mobileTopDept'/);
  assert.match(html, /setMetricPair\('topStaff', 'mobileTopStaff'/);
  assert.match(html, /setMetricPair\('apiStatus', 'mobileApiStatus'/);
});
```

- [ ] **Step 2: Run the test and verify RED**

Run:

```powershell
$node='C:\Users\Theboy-AsusTUF\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe'
& $node --test tests\mobile-metric-strip.test.mjs
```

Expected: FAIL because `.mobile-metric-strip`, mobile IDs, CSS, and `setMetricPair` do not exist.

- [ ] **Step 3: Commit the failing test**

```powershell
git add tests/mobile-metric-strip.test.mjs
git commit -m "Test mobile metric strip layout"
```

---

### Task 2: Implement dedicated desktop and mobile metric surfaces

**Files:**
- Modify: `public/IT-Call-Skeuomorph.html:183-224`
- Modify: `public/IT-Call-Skeuomorph.html:610-637`
- Modify: `public/IT-Call-Skeuomorph.html:1173-1208`
- Test: `tests/mobile-metric-strip.test.mjs`

**Interfaces:**
- Consumes: live metric values calculated by `updateMetrics(data)` and API state supplied to `setApiStatus(message, colorClass, mobileMessage)`
- Produces: `setMetricPair(desktopId, mobileId, desktopValue, mobileValue)` and mobile IDs `mobileTotalTickets`, `mobileTopDept`, `mobileTopStaff`, `mobileApiStatus`

- [ ] **Step 1: Mark the existing grid as desktop-only**

Change the existing wrapper to:

```html
<div class="desktop-metric-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
```

- [ ] **Step 2: Add the dedicated mobile metric strip after the desktop grid**

```html
<div class="mobile-metric-strip" role="group" aria-label="ตัวชี้วัดสำคัญบนมือถือ">
    <article class="mobile-metric-card mobile-metric-card-blue" data-metric-label="Ticket" aria-label="Ticket: 0">
        <i class="ph ph-ticket" aria-hidden="true"></i>
        <span>Ticket</span>
        <strong class="mobile-metric-value" id="mobileTotalTickets" title="0">0</strong>
    </article>
    <article class="mobile-metric-card mobile-metric-card-purple" data-metric-label="แผนก" aria-label="แผนก: -">
        <i class="ph ph-buildings" aria-hidden="true"></i>
        <span>แผนก</span>
        <strong class="mobile-metric-value" id="mobileTopDept" title="-">-</strong>
    </article>
    <article class="mobile-metric-card mobile-metric-card-orange" data-metric-label="ผู้รับ" aria-label="ผู้รับ: -">
        <i class="ph ph-user-gear" aria-hidden="true"></i>
        <span>ผู้รับ</span>
        <strong class="mobile-metric-value" id="mobileTopStaff" title="-">-</strong>
    </article>
    <article class="mobile-metric-card mobile-metric-card-green" data-metric-label="สถานะ" aria-label="สถานะ: รอสักครู่">
        <i class="ph ph-check-circle" aria-hidden="true"></i>
        <span>สถานะ</span>
        <strong class="mobile-metric-value" id="mobileApiStatus" title="รอสักครู่">รอ</strong>
    </article>
</div>
```

- [ ] **Step 3: Add isolated mobile CSS**

Add to the existing `<style>` block:

```css
.mobile-metric-strip {
    display: none;
}

@media (max-width: 600px) {
    .desktop-metric-grid {
        display: none !important;
    }

    .mobile-metric-strip {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 6px;
        width: 100%;
        margin-bottom: 1.5rem;
    }

    .mobile-metric-card {
        min-width: 0;
        min-height: 92px;
        padding: 9px 5px 8px;
        border: 1px solid #d4c5a9;
        border-bottom-width: 3px;
        border-radius: 12px;
        background: linear-gradient(180deg, #fefcf8 0%, #f6f0e4 100%);
        box-shadow: 0 2px 7px rgba(90, 70, 50, 0.12);
        display: grid;
        grid-template-rows: 27px auto auto;
        align-items: center;
        justify-items: center;
        overflow: hidden;
    }

    .mobile-metric-card > i {
        font-size: 22px;
        line-height: 1;
    }

    .mobile-metric-card > span {
        max-width: 100%;
        color: #64748b;
        font-size: 9px;
        font-weight: 600;
        line-height: 1.1;
        white-space: nowrap;
    }

    .mobile-metric-value {
        display: block;
        max-width: 100%;
        color: #1e293b;
        font-family: 'Kanit', sans-serif;
        font-size: clamp(12px, 3.5vw, 15px);
        font-weight: 800;
        line-height: 1.2;
        overflow: hidden;
        text-align: center;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .mobile-metric-card-blue { color: #2563eb; border-bottom-color: #3b82f6; }
    .mobile-metric-card-purple { color: #9333ea; border-bottom-color: #a855f7; }
    .mobile-metric-card-orange { color: #ea580c; border-bottom-color: #f97316; }
    .mobile-metric-card-green { color: #059669; border-bottom-color: #10b981; }
    .mobile-metric-card-green .mobile-metric-value { color: #059669; }
}
```

- [ ] **Step 4: Add the paired value helper**

Add before `updateMetrics(data)`:

```js
function setMetricPair(desktopId, mobileId, desktopValue, mobileValue = desktopValue) {
    const desktop = document.getElementById(desktopId);
    const mobile = document.getElementById(mobileId);
    const fullValue = String(desktopValue);

    desktop.textContent = fullValue;
    mobile.textContent = String(mobileValue);
    mobile.title = fullValue;

    const mobileCard = mobile.closest('[data-metric-label]');
    if (mobileCard) {
        mobileCard.setAttribute(
            'aria-label',
            `${mobileCard.dataset.metricLabel}: ${fullValue}`
        );
    }
}
```

- [ ] **Step 5: Update calculated metrics through the helper**

Use:

```js
setMetricPair('totalTickets', 'mobileTotalTickets', data.length);
setMetricPair('topDept', 'mobileTopDept', topDept);
setMetricPair('topStaff', 'mobileTopStaff', topStaff);
```

For the empty state, call both top metric pairs with `"-"` before returning.

- [ ] **Step 6: Update API status through the helper**

Change the function to:

```js
function setApiStatus(message, colorClass, mobileMessage = message) {
    const status = document.getElementById('apiStatus');
    status.className = `text-xl font-bold ${colorClass}`;
    setMetricPair('apiStatus', 'mobileApiStatus', message, mobileMessage);
}
```

Use the following mobile messages at the existing call sites:

```js
setApiStatus('กำลังโหลด...', 'text-blue-600', 'โหลด');
setApiStatus(
    rawJson.length === 0 ? 'ไม่มีข้อมูล' : 'เชื่อมต่อสำเร็จ',
    rawJson.length === 0 ? 'text-slate-400' : 'text-emerald-600',
    rawJson.length === 0 ? 'ว่าง' : 'สำเร็จ'
);
setApiStatus(
    error.name === 'AbortError' ? 'หมดเวลารอข้อมูล' : 'เกิดข้อผิดพลาด',
    'text-red-500',
    error.name === 'AbortError' ? 'หมดเวลา' : 'ผิดพลาด'
);
```

- [ ] **Step 7: Run targeted test and verify GREEN**

Run:

```powershell
$node='C:\Users\Theboy-AsusTUF\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe'
& $node --test tests\mobile-metric-strip.test.mjs
```

Expected: 3 tests pass.

- [ ] **Step 8: Commit the implementation**

```powershell
git add public/IT-Call-Skeuomorph.html tests/mobile-metric-strip.test.mjs
git commit -m "Add compact mobile metric strip"
```

---

### Task 3: Verify responsiveness and publish

**Files:**
- Verify: `public/IT-Call-Skeuomorph.html`
- Verify: `.openai/hosting.json`

**Interfaces:**
- Consumes: committed mobile metric strip and current Sites project ID
- Produces: validated saved Sites version and successful production deployment

- [ ] **Step 1: Run full automated verification**

Run:

```powershell
$node='C:\Users\Theboy-AsusTUF\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe'
& $node node_modules\vinext\dist\cli.js build
& $node --test tests\*.test.mjs
& $node node_modules\eslint\bin\eslint.js . --ignore-pattern dist --ignore-pattern .next
git diff --check
git status --short
```

Expected: build succeeds, all tests pass, lint exits 0, `git diff --check` exits 0, and the working tree is clean.

- [ ] **Step 2: Start a local production server**

Run on an unused high port:

```powershell
$node='C:\Users\Theboy-AsusTUF\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe'
& $node node_modules\vinext\dist\cli.js start --port 43128 --hostname 127.0.0.1
```

- [ ] **Step 3: Inspect mobile layouts**

At 320×800, 360×800, and 390×844 verify:

- `.mobile-metric-strip` resolves to `display: grid`
- `.desktop-metric-grid` resolves to `display: none`
- the mobile strip has four columns and four cards with equal top offsets
- `document.documentElement.scrollWidth === document.documentElement.clientWidth`
- each `.mobile-metric-value` has `white-space: nowrap` and `text-overflow: ellipsis`
- selecting department `ER` updates desktop/mobile metric values immediately

- [ ] **Step 4: Push the exact source commit**

Use a fresh Sites source-repository credential and push the current `main` HEAD with per-command authentication. Confirm the pushed branch-head SHA equals `git rev-parse HEAD`.

- [ ] **Step 5: Package and save the Sites version**

Run:

```powershell
& 'C:\Program Files\Git\bin\bash.exe' -c "export PATH='/usr/bin:/bin'; bash '/c/Users/Theboy-AsusTUF/.codex/plugins/cache/openai-bundled/sites/0.1.31/scripts/package-site.sh' '.' '../site-mobile-metrics.tar'"
```

Save the archive using the exact pushed commit SHA and project ID from `.openai/hosting.json`.

- [ ] **Step 6: Deploy and verify production**

Deploy the saved version, poll until the status is `succeeded`, then verify:

- the production root redirects to the Skeuomorph dashboard
- API status becomes `เชื่อมต่อสำเร็จ`
- four mobile metric cards remain on one row at 360×800
- production has no page-level horizontal overflow

- [ ] **Step 7: Report completion**

Report the Sites version number, production URL, automated test count, verified viewports, and API/filter results.
