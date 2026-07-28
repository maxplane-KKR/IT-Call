# Operation Log Detail Column Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** เพิ่มรายละเอียดเหตุการณ์ใน Operation Log ทั้ง desktop และ mobile โดยคงความหนาแน่นและความเร็วของแดชบอร์ดเดิม

**Architecture:** ใช้ `record.detail` ที่ normalization มีอยู่แล้วและ render ใน markup เดิมโดยไม่เพิ่ม state หรือ API call ใหม่ ฝั่ง desktop ใช้คอลัมน์แบบ two-line clamp ส่วน mobile ใช้บล็อกข้อความเต็มภายใน record card

**Tech Stack:** React 19, TypeScript/TSX, CSS, Node test runner, vinext, Sites

## Global Constraints

- Desktop เพิ่มคอลัมน์ `รายละเอียด` ระหว่าง `แผนก` และ `เหตุการณ์`
- Desktop จำกัดรายละเอียด 2 บรรทัด เก็บข้อความเต็มใน DOM และใส่ `title`
- Mobile แสดงรายละเอียดเต็มเป็นบล็อกแยกและตัดคำยาวได้
- รายละเอียดว่างแสดง `—`
- ไม่เพิ่ม API request, state, dependency หรือ interaction ใหม่
- ตรวจ viewport 390×844 และ 360×800 ว่าไม่มี horizontal overflow และแท็กเหตุการณ์ไม่ชนข้อความ

---

### Task 1: Render Incident Details Responsively

**Files:**
- Modify: `tests/rendered-html.test.mjs`
- Modify: `app/page.tsx`
- Modify: `app/globals.css`

**Interfaces:**
- Consumes: `DashboardRecord.detail?: string` จาก `normalizeLiveRows()`
- Produces: `.record-detail-cell`, `.record-detail-text` และ `.record-card-detail`

- [ ] **Step 1: Write the failing rendering test**

เพิ่มใน `tests/rendered-html.test.mjs`:

```js
test("renders incident details in desktop rows and mobile cards", async () => {
  const [page, styles] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);

  assert.match(page, /<th className="detail-column" scope="col">รายละเอียด<\/th>/);
  assert.match(page, /className="record-detail-cell"/);
  assert.match(page, /className="record-detail-text"/);
  assert.match(page, /className="record-card-detail"/);
  assert.equal((page.match(/record\.detail \|\| "—"/g) ?? []).length, 2);
  assert.match(styles, /-webkit-line-clamp:\s*2/);
  assert.match(styles, /\.record-card-detail p[^}]*overflow-wrap:\s*anywhere/s);
});
```

- [ ] **Step 2: Run the test and verify RED**

Run:

```powershell
node --test --test-name-pattern="renders incident details" tests/rendered-html.test.mjs
```

Expected: FAIL เพราะยังไม่มีหัวคอลัมน์และคลาสรายละเอียด

- [ ] **Step 3: Add desktop and mobile markup**

ใน `app/page.tsx`:

```tsx
<th className="detail-column" scope="col">รายละเอียด</th>
<th scope="col">เหตุการณ์</th>
```

เพิ่ม cell ก่อน event tag:

```tsx
<td className="record-detail-cell">
  <span
    className="record-detail-text"
    title={record.detail || "ไม่มีรายละเอียด"}
  >
    {record.detail || "—"}
  </span>
</td>
```

เพิ่มใน mobile card ระหว่าง `.record-card-main` และ `.record-card-bottom`:

```tsx
<div className="record-card-detail">
  <span>รายละเอียด</span>
  <p>{record.detail || "—"}</p>
</div>
```

- [ ] **Step 4: Add restrained responsive styles**

ใน `app/globals.css`:

```css
table { border-collapse: collapse; min-width: 1040px; width: 100%; }
.detail-column { width: 38%; }
.record-detail-cell { max-width: 520px; }
.record-detail-text {
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  display: -webkit-box;
  line-height: 1.55;
  overflow: hidden;
  overflow-wrap: anywhere;
}
```

ภายใน `@media (max-width: 600px)`:

```css
.record-card-detail { margin: 0 0 12px; }
.record-card-detail > span {
  color: var(--faint);
  display: block;
  font-family: "Fira Code", monospace;
  font-size: 10px;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}
.record-card-detail p {
  color: var(--text);
  font-size: 13px;
  line-height: 1.55;
  margin: 5px 0 0;
  overflow-wrap: anywhere;
  white-space: pre-wrap;
}
```

- [ ] **Step 5: Run the targeted test and verify GREEN**

Run:

```powershell
node --test --test-name-pattern="renders incident details" tests/rendered-html.test.mjs
```

Expected: PASS

- [ ] **Step 6: Commit the responsive detail rendering**

```powershell
git add app/page.tsx app/globals.css tests/rendered-html.test.mjs
git commit -m "Add incident details to operation log"
```

---

### Task 2: Validate Mobile UI

**Files:**
- Modify only if QA finds a concrete layout defect: `app/globals.css`
- Test: `tests/rendered-html.test.mjs`

**Interfaces:**
- Consumes: completed Operation Log page from Task 1
- Produces: verified responsive layout at 390×844 and 360×800

- [ ] **Step 1: Build and run the validated local site**

```powershell
pnpm run build
pnpm run start
```

- [ ] **Step 2: Inspect iOS-sized viewport**

Open the local page at 390×844, scroll to Operation Log, and verify:

```text
document.documentElement.scrollWidth === document.documentElement.clientWidth
```

Confirm the detail label, full detail text and event tag remain separate.

- [ ] **Step 3: Inspect Android-sized viewport**

Repeat at 360×800 and confirm:

```text
document.documentElement.scrollWidth === document.documentElement.clientWidth
```

Confirm long detail text wraps without clipping or pushing the event tag outside the card.

- [ ] **Step 4: Fix only observed defects**

If overflow occurs, update `.record-card-detail p` and the narrow-screen container without changing desktop behavior. Add a matching regression assertion before each CSS fix, then rerun the targeted test.

---

### Task 3: Verify and Save the Sites Version

**Files:**
- Verify all changed files
- Preserve: `.openai/hosting.json`

**Interfaces:**
- Consumes: committed responsive detail implementation
- Produces: validated, pushed and saved Sites version ready for deployment approval

- [ ] **Step 1: Run the full verification suite**

```powershell
pnpm run test
pnpm run lint
git diff --check
```

Expected: build succeeds, all tests pass, lint exits 0 and diff check is clean

- [ ] **Step 2: Package the exact validated commit**

Use the Sites packaging helper against the current committed source and verify the archive references the current `HEAD`.

- [ ] **Step 3: Save a new Sites version**

Push the current commit, save one Sites version, retain its user-facing version number, and do not deploy publicly until the user approves.

