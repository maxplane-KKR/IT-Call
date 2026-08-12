# แผนรวมสรุป HR เข้าหน้า Dashboard บน iPad

> **สำหรับ agentic workers:** REQUIRED SUB-SKILL: ใช้ `superpowers:subagent-driven-development` (แนะนำ) หรือ `superpowers:executing-plans` เพื่อทำตามแผนทีละงาน ทุกขั้นใช้ checkbox (`- [ ]`) สำหรับติดตามผล

**เป้าหมาย:** รวมสรุป HR เข้า Dashboard ให้ iPad Air ใช้พื้นที่เต็มจอโดยเลื่อนเฉพาะรายการ HR และลดแถบนำทางล่างเหลือ 3 เมนู

**สถาปัตยกรรม:** ย้าย markup HR เดิมเข้า `mobile-section-dashboard` เพื่อใช้ renderer และข้อมูลเดิมโดยไม่เพิ่ม logic ซ้ำ จากนั้นกำหนด CSS เฉพาะช่วง 768–1279 พิกเซลให้แนวตั้งเป็น 3 แถวและแนวนอนเป็น 3 คอลัมน์ พร้อมจำกัด overflow ไว้ที่ `mobileHRContainer`

**เทคโนโลยี:** HTML5, Tailwind utility classes ที่มีอยู่, CSS media queries, JavaScript DOM เดิม, Node.js test runner, Vinext/Vite

## ข้อจำกัดร่วม

- ไม่เพิ่ม dependency
- ไม่แก้ API สูตรคำนวณค่าตอบแทน หรือข้อมูลต้นทาง
- เดสก์ท็อปตั้งแต่ 1280 พิกเซลขึ้นไปต้องไม่เปลี่ยนโครงเดิม
- iPad Dashboard ต้องไม่เลื่อนทั้งหน้า แต่รายการ HR เลื่อนภายในการ์ดได้
- มือถือต่ำกว่า 768 พิกเซลให้ Dashboard เลื่อนตามเนื้อหาตามปกติ
- ไม่ deploy production จนกว่าจะได้รับอนุญาตโดยตรง

## โครงสร้างไฟล์

- `public/IT-Call-Skeuomorph.html`: ย้าย HR เข้า Dashboard และลบแท็บ HR
- `public/css/styles.css`: กำหนดความสูง กริด และ overflow สำหรับ iPad
- `tests/ipad-air-hr-dashboard.test.mjs`: ตรวจโครง DOM และเมนูหลังรวม HR
- `tests/ipad-air-layout.test.mjs`: ตรวจ 3 แถวแนวตั้งและ 3 คอลัมน์แนวนอน
- `tests/ipad-air-fill.test.mjs`: ตรวจการใช้ความสูงเต็มจอและการเลื่อนภายในการ์ด HR

---

### งานที่ 1: รวม markup HR เข้า Dashboard และลดเมนูเหลือ 3 รายการ

**ไฟล์:**
- สร้าง: `tests/ipad-air-hr-dashboard.test.mjs`
- แก้ไข: `public/IT-Call-Skeuomorph.html:301-450`

**อินเทอร์เฟซ:**
- ใช้: `renderMobileHRReport(data, activeMonthDisplay)` ซึ่งค้นหา `mobileHRContainer` และ `mobileHRSubtitle`
- ส่งมอบ: `mobileHRContainer` อยู่ใต้ `mobile-section-dashboard`; ไม่มี `data-tab="hr"`; มี class `tablet-dashboard-hr-card`

- [ ] **ขั้นที่ 1: เขียนเทสต์ที่ต้องล้มเหลวก่อน**

```js
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("HR summary is embedded in Dashboard and removed from bottom navigation", async () => {
  const html = await readFile(
    new URL("../public/IT-Call-Skeuomorph.html", import.meta.url),
    "utf8",
  );

  const dashboardStart = html.indexOf('id="mobile-section-dashboard"');
  const hrContainer = html.indexOf('id="mobileHRContainer"');
  const chartsSection = html.indexOf('id="mobile-section-charts"');

  assert.ok(dashboardStart >= 0);
  assert.ok(hrContainer > dashboardStart);
  assert.ok(chartsSection > hrContainer);
  assert.match(html, /class="tablet-dashboard-hr-card[^\"]*"/);
  assert.doesNotMatch(html, /data-tab="hr"/);
  assert.deepEqual(
    [...html.matchAll(/data-tab="(dashboard|log|charts)"/g)].map((match) => match[1]),
    ["dashboard", "log", "charts"],
  );
});
```

- [ ] **ขั้นที่ 2: รันเทสต์และยืนยันว่าแดง**

รัน: `node --test tests/ipad-air-hr-dashboard.test.mjs`

ผลที่คาด: FAIL เพราะ HR ยังเป็นแท็บแยกและยังมี `data-tab="hr"`

- [ ] **ขั้นที่ 3: ย้าย markup ขั้นต่ำ**

ใน `public/IT-Call-Skeuomorph.html`:

```html
<div id="mobile-section-dashboard" class="space-y-4">
  <!-- การ์ดตัวเลขและกราฟเดิม -->

  <div class="tablet-dashboard-hr-card glass-card p-4 border-t-4 border-t-rose-500">
    <!-- หัวข้อ ปุ่ม export และ mobileHRContainer เดิมทั้งหมด -->
  </div>
</div>
```

ลบ wrapper `id="mobile-section-hr"` และลบปุ่มนำทางที่มี `data-tab="hr"` โดยไม่เปลี่ยน ID ภายในหรือ class `export-hr-btn`

- [ ] **ขั้นที่ 4: รันเทสต์ markup และลำดับแท็บ**

รัน: `node --test tests/ipad-air-hr-dashboard.test.mjs tests/mobile-tab-order.test.mjs`

ผลที่คาด: PASS ทั้งหมด และลำดับแท็บเป็น Dashboard → Log → Charts

- [ ] **ขั้นที่ 5: Commit งาน markup**

```bash
git add public/IT-Call-Skeuomorph.html tests/ipad-air-hr-dashboard.test.mjs
git commit -m "Move HR summary into mobile dashboard"
```

---

### งานที่ 2: จัด Dashboard iPad ให้เต็มจอและจำกัดการเลื่อนอยู่ในการ์ด HR

**ไฟล์:**
- แก้ไข: `public/css/styles.css:323-410`
- แก้ไข: `tests/ipad-air-layout.test.mjs`
- แก้ไข: `tests/ipad-air-fill.test.mjs`

**อินเทอร์เฟซ:**
- ใช้: class `tablet-dashboard-chart-card`, `tablet-dashboard-chart-frame`, `tablet-dashboard-hr-card`
- ส่งมอบ: แนวตั้ง 3 แถว, แนวนอน 3 คอลัมน์, `mobileHRContainer` เป็น scroll container

- [ ] **ขั้นที่ 1: ขยาย regression tests ให้ครอบคลุม HR**

เพิ่ม assertion ต่อไปนี้:

```js
assert.match(
  css,
  /grid-template-rows:\s*auto minmax\(0, 1\.1fr\) minmax\(0, 0\.9fr\)/,
);
assert.match(
  css,
  /@media \(min-width: 1024px\) and \(max-width: 1279px\)[\s\S]*grid-template-columns:\s*minmax\(0, 0\.78fr\) minmax\(0, 1\.05fr\) minmax\(0, 1fr\)/,
);
assert.match(
  css,
  /#mobileHRContainer\s*{[\s\S]*overflow-y:\s*auto[\s\S]*overscroll-behavior-y:\s*contain/,
);
```

- [ ] **ขั้นที่ 2: รันเทสต์และยืนยันว่าแดง**

รัน: `node --test tests/ipad-air-layout.test.mjs tests/ipad-air-fill.test.mjs`

ผลที่คาด: FAIL เพราะ CSS ปัจจุบันมี 2 แถว/2 คอลัมน์และยังไม่จำกัด overflow ของ HR

- [ ] **ขั้นที่ 3: ใช้ CSS ขั้นต่ำตามสเป็ก**

```css
@media (min-width: 768px) and (max-width: 1279px) {
  #mobile-section-dashboard:not(.hidden) {
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: auto minmax(0, 1.1fr) minmax(0, 0.9fr);
  }

  .tablet-dashboard-chart-card,
  .tablet-dashboard-hr-card {
    display: flex;
    flex-direction: column;
    min-height: 0;
    height: 100%;
  }

  .tablet-dashboard-hr-card {
    overflow: hidden;
  }

  #mobileHRContainer {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    overscroll-behavior-y: contain;
  }
}

@media (min-width: 1024px) and (max-width: 1279px) {
  #mobile-section-dashboard:not(.hidden) {
    grid-template-columns: minmax(0, 0.78fr) minmax(0, 1.05fr) minmax(0, 1fr);
    grid-template-rows: minmax(0, 1fr);
  }
}
```

- [ ] **ขั้นที่ 4: รันเทสต์ iPad อีกครั้ง**

รัน: `node --test tests/ipad-air-layout.test.mjs tests/ipad-air-fill.test.mjs tests/ipad-air-hr-dashboard.test.mjs`

ผลที่คาด: PASS ทุกเทสต์

- [ ] **ขั้นที่ 5: Commit งาน responsive layout**

```bash
git add public/css/styles.css tests/ipad-air-layout.test.mjs tests/ipad-air-fill.test.mjs
git commit -m "Fill iPad dashboard with HR summary"
```

---

### งานที่ 3: ตรวจผลกระทบทั้งระบบและเตรียมส่งมอบภายในเครื่อง

**ไฟล์:**
- ตรวจสอบ: `public/IT-Call-Skeuomorph.html`
- ตรวจสอบ: `public/css/styles.css`
- ตรวจสอบ: `tests/*.test.mjs`

**อินเทอร์เฟซ:**
- ใช้: source state จากงานที่ 1–2
- ส่งมอบ: build, test, lint และ Git working tree ที่ไม่มีไฟล์ทดลองของผู้ช่วย

- [ ] **ขั้นที่ 1: ตรวจ whitespace และไฟล์ทดลอง**

รัน: `git diff --check` และลบเฉพาะ `sandbox-probe.txt` ซึ่งเป็นไฟล์ทดลองที่สร้างระหว่างการดีบัก

ผลที่คาด: ไม่มี whitespace error และไม่มี `sandbox-probe.txt`

- [ ] **ขั้นที่ 2: รัน test suite ทั้งหมด**

รัน: `npm test`

ผลที่คาด: Vinext build สำเร็จและทุก test PASS

- [ ] **ขั้นที่ 3: รัน lint**

รัน: `npm run lint`

ผลที่คาด: exit code 0 โดยไม่มี lint error

- [ ] **ขั้นที่ 4: ตรวจสถานะ Git**

รัน: `git status --short` และ `git log -3 --oneline`

ผลที่คาด: ไม่มีไฟล์งานค้างนอกจากสิ่งที่ระบุชัด และมี commit ของ markup กับ responsive layout

- [ ] **ขั้นที่ 5: ส่งมอบผลโดยไม่ deploy**

สรุปไฟล์ที่แก้ คำสั่งที่รัน จำนวนเทสต์ที่ผ่าน และข้อจำกัดว่า visual browser QA อัตโนมัติอาจถูก Windows sandbox ปิดกั้น ไม่ push หรือ deploy จนกว่าผู้ใช้จะอนุญาตโดยตรง
