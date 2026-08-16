# แผน Implementation รีดีไซน์ IT-Call แบบ Command Ribbon

> **สำหรับ agentic workers:** REQUIRED SUB-SKILL: ใช้ `superpowers:subagent-driven-development` (แนะนำ) หรือ `superpowers:executing-plans` เพื่อทำแผนนี้ทีละ Task โดยทุก Step ใช้ checkbox (`- [ ]`) สำหรับติดตาม

**เป้าหมาย:** เปลี่ยน IT-Call ให้เป็น Command Ribbon Dashboard ที่รองรับ Desktop, Touch Tablet และมือถือ พร้อม 6 ธีมและ Theme Drawer โดยรักษาข้อมูล API รายงาน HR การส่งออก CSV กราฟ PWA และรายการแจ้งซ่อมเดิม

**สถาปัตยกรรม:** รักษา `/api/incidents → AppState → filters → renderers` เป็นสายข้อมูลหลัก และเพิ่ม `theme-system.js` เป็นโมดูล state อิสระที่ควบคุม CSS variables, DOM classes และ localStorage เท่านั้น โครงสร้าง HTML จะจัดลำดับใหม่แต่รักษา ID ที่ renderer ใช้ และเพิ่มแท็บ `team` สำหรับ Touch Tablet/Mobile ตามดีไซน์ 4 แท็บที่อนุมัติ

**Tech Stack:** Vanilla HTML/CSS/ES Modules, Chart.js 4.4.7, Tailwind CDN 3.4.17, Phosphor Icons 2.1.1, Node.js `>=22.13.0`, Node Test Runner, vinext/Next.js

## ข้อจำกัดส่วนกลาง

- ค่าเริ่มต้นต้องเป็น Netflix + Dark Glass + opacity `88` + blur `12px`
- รองรับธีม `Mint`, `Neon`, `Rose`, `Sunset`, `Netflix`, `Luxury`
- Desktop ใช้ layout เต็มที่ `>=1280px`; Touch Tablet ใช้ช่วง `768–1279px`; Mobile ใช้ช่วง `320–767px`
- Custom Image ใช้กับ Hero Overview เท่านั้น ขนาดไม่เกิน `8MB` ไม่แตะ `body.style.backgroundImage` และไม่บันทึก Base64 ลง localStorage
- ปุ่มและ input ต้องมี touch target อย่างน้อย `44px`, contrast อย่างน้อย `4.5:1`, focus-visible ชัดเจน และรองรับ `prefers-reduced-motion`
- คง API endpoint `/api/incidents`, timeout `50_000ms`, auto refresh 5 นาที, สูตร HR, CSV UTF-8 และ PWA assets เดิม
- ห้ามเพิ่ม dependency, แก้ lockfile, environment files, generated output, Apps Script หรือฐานข้อมูล
- ใช้ TDD: เพิ่มหรือแก้ test ให้ fail ก่อน แล้วจึงแก้ implementation ให้ pass

---

## โครงสร้างไฟล์หลังทำเสร็จ

- `public/js/theme-system.js` — config, validation, storage, ThemeState, DOM rendering และ events ของธีม
- `public/js/app.js` — controller ข้อมูลเดิม เพิ่มเพียง init ธีม, 4-tab navigation และ chart theme refresh
- `public/IT-Call-Skeuomorph.html` — Command Ribbon markup, Hero, Theme Drawer/Bottom Sheet และ 4 compact sections
- `public/css/styles.css` — design tokens, 6 presets, Glass surfaces, Desktop/Tablet/Mobile layout และ accessibility states
- `public/mobile-navigation.mjs` — ลำดับแท็บ `dashboard`, `team`, `charts`, `log`
- `public/js/mobile-view.js` — compact section map ให้ตรงกับแท็บใหม่
- `tests/theme-system.test.mjs` — pure state/validation/storage tests
- `tests/theme-ui-contract.test.mjs` — Theme Drawer, Hero และ integration contracts
- `tests/command-ribbon-layout.test.mjs` — DOM order และ ID preservation
- `tests/mobile-tab-order.test.mjs` — 4-tab contract
- `tests/ipad-air-hr-dashboard.test.mjs` — HR อยู่ใน Team tab
- `tests/ipad-air-fill.test.mjs` และ `tests/ipad-air-layout.test.mjs` — single scroller และ Tablet grid contract

---

### Task 1: สร้าง Theme State และ Validation แบบ pure functions

**Files:**
- Create: `public/js/theme-system.js`
- Create: `tests/theme-system.test.mjs`

**Interfaces:**
- Produces: `CARD_THEME_CONFIG`, `clampNumber(value, min, max, fallback)`, `normalizeCardPreferences(value)`, `loadCardPreferences(storage)`, `loadAppThemeMode(storage)`, `saveAppThemeMode(storage, mode)`, `saveCardPreferences(storage, state)`, `validateCustomImageFile(file)`
- Consumes: Web Storage-compatible object ที่มี `getItem`/`setItem`

- [ ] **Step 1: เขียน failing tests สำหรับค่าเริ่มต้น whitelist clamp storage และรูปภาพ**

```js
// tests/theme-system.test.mjs
import assert from "node:assert/strict";
import test from "node:test";
import {
  CARD_THEME_CONFIG,
  loadAppThemeMode,
  loadCardPreferences,
  normalizeCardPreferences,
  saveAppThemeMode,
  saveCardPreferences,
  validateCustomImageFile,
} from "../public/js/theme-system.js";

function createStorage(seed = {}) {
  const values = new Map(Object.entries(seed));
  return {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); },
    value(key) { return values.get(key); },
  };
}

test("ใช้ Netflix Dark 88/12 เมื่อไม่มีค่าที่บันทึก", () => {
  assert.deepEqual(loadCardPreferences(createStorage()), {
    theme: "theme-netflix",
    glassMode: "dark",
    opacity: 88,
    blur: 12,
  });
});

test("ตัดค่าที่ไม่รองรับและ clamp ตัวเลขก่อนใช้", () => {
  assert.deepEqual(normalizeCardPreferences({
    version: 1,
    theme: "theme-unknown",
    glassMode: "sepia",
    opacity: 500,
    blur: -5,
  }), {
    theme: "theme-netflix",
    glassMode: "dark",
    opacity: 100,
    blur: 0,
  });
});

test("fallback เมื่อ JSON เสียและไม่รับ app mode อื่น", () => {
  const storage = createStorage({
    it_call_card_preferences: "{broken",
    it_call_app_theme: "sepia",
  });
  assert.equal(loadCardPreferences(storage).theme, "theme-netflix");
  assert.equal(loadAppThemeMode(storage), "dark");
});

test("บันทึกเฉพาะค่าปลอดภัยโดยไม่มี customImageData", () => {
  const storage = createStorage();
  saveCardPreferences(storage, {
    theme: "theme-mint",
    glassMode: "light",
    opacity: 76,
    blur: 9,
    customImageData: "data:image/png;base64,not-persisted",
  });
  const saved = JSON.parse(storage.value("it_call_card_preferences"));
  assert.deepEqual(saved, {
    version: 1,
    theme: "theme-mint",
    glassMode: "light",
    opacity: 76,
    blur: 9,
  });
  saveAppThemeMode(storage, "light");
  assert.equal(storage.value("it_call_app_theme"), "light");
});

test("รับเฉพาะรูปไม่เกิน 8MB", () => {
  assert.deepEqual(validateCustomImageFile({ type: "image/png", size: 1024 }), { ok: true });
  assert.equal(validateCustomImageFile({ type: "text/plain", size: 1024 }).ok, false);
  assert.equal(validateCustomImageFile({ type: "image/jpeg", size: 8 * 1024 * 1024 + 1 }).ok, false);
});

test("config มี 6 ธีมและ Netflix เป็นค่าเริ่มต้น", () => {
  assert.equal(CARD_THEME_CONFIG.themes.length, 6);
  assert.equal(CARD_THEME_CONFIG.defaults.theme, "theme-netflix");
});
```

- [ ] **Step 2: รัน test และยืนยันว่า fail เพราะยังไม่มีโมดูล**

Run: `node --test tests/theme-system.test.mjs`  
Expected: FAIL ด้วย `ERR_MODULE_NOT_FOUND` สำหรับ `public/js/theme-system.js`

- [ ] **Step 3: เขียน pure implementation ขั้นต่ำ**

```js
// public/js/theme-system.js
export const CARD_THEME_CONFIG = Object.freeze({
  storageKeys: {
    cardPreferences: "it_call_card_preferences",
    appTheme: "it_call_app_theme",
  },
  defaults: {
    theme: "theme-netflix",
    glassMode: "dark",
    opacity: 88,
    blur: 12,
    appThemeMode: "dark",
  },
  limits: {
    opacity: { min: 40, max: 100 },
    blur: { min: 0, max: 30 },
    customImageBytes: 8 * 1024 * 1024,
  },
  themes: [
    "theme-mint",
    "theme-neon",
    "theme-rose",
    "theme-sunset",
    "theme-netflix",
    "theme-luxury",
  ],
});

const supportedThemes = new Set(CARD_THEME_CONFIG.themes);

export function clampNumber(value, min, max, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, number));
}

export function normalizeCardPreferences(value) {
  const defaults = CARD_THEME_CONFIG.defaults;
  const source = value && value.version === 1 ? value : {};
  return {
    theme: supportedThemes.has(source.theme) ? source.theme : defaults.theme,
    glassMode: source.glassMode === "light" || source.glassMode === "dark"
      ? source.glassMode
      : defaults.glassMode,
    opacity: clampNumber(source.opacity, 40, 100, defaults.opacity),
    blur: clampNumber(source.blur, 0, 30, defaults.blur),
  };
}

export function loadCardPreferences(storage) {
  try {
    return normalizeCardPreferences(JSON.parse(
      storage.getItem(CARD_THEME_CONFIG.storageKeys.cardPreferences) || "null",
    ));
  } catch {
    return normalizeCardPreferences(null);
  }
}

export function loadAppThemeMode(storage) {
  try {
    const mode = storage.getItem(CARD_THEME_CONFIG.storageKeys.appTheme);
    return mode === "light" || mode === "dark" ? mode : "dark";
  } catch {
    return "dark";
  }
}

export function saveAppThemeMode(storage, mode) {
  storage.setItem(
    CARD_THEME_CONFIG.storageKeys.appTheme,
    mode === "light" ? "light" : "dark",
  );
}

export function saveCardPreferences(storage, state) {
  const preferences = normalizeCardPreferences({ version: 1, ...state });
  storage.setItem(
    CARD_THEME_CONFIG.storageKeys.cardPreferences,
    JSON.stringify({ version: 1, ...preferences }),
  );
}

export function validateCustomImageFile(file) {
  if (!file?.type?.startsWith("image/")) {
    return { ok: false, message: "กรุณาเลือกไฟล์รูปภาพ" };
  }
  if (file.size > CARD_THEME_CONFIG.limits.customImageBytes) {
    return { ok: false, message: "รูปภาพต้องมีขนาดไม่เกิน 8MB" };
  }
  return { ok: true };
}
```

- [ ] **Step 4: รัน test และยืนยันว่า pass**

Run: `node --test tests/theme-system.test.mjs`  
Expected: PASS 6 tests, FAIL 0

- [ ] **Step 5: Commit Task 1**

```bash
git add public/js/theme-system.js tests/theme-system.test.mjs
git commit -m "feat: add validated IT-Call theme state"
```

---

### Task 2: เพิ่ม Theme Drawer/Bottom Sheet และ DOM Controller

**Files:**
- Modify: `public/IT-Call-Skeuomorph.html:35-70,455-456`
- Modify: `public/js/theme-system.js`
- Create: `tests/theme-ui-contract.test.mjs`

**Interfaces:**
- Consumes: pure functions จาก Task 1 และ DOM IDs ในส่วนนี้
- Produces: `initThemeSystem({ documentLike, windowLike, storage })`, event `itcall:themechange`, DOM IDs `themePanelToggle`, `themePanel`, `themePanelBackdrop`, `cardThemePreview`, `cardGlassSurface`

- [ ] **Step 1: เขียน failing HTML/JS contract test**

```js
// tests/theme-ui-contract.test.mjs
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("มี Theme Drawer ที่เข้าถึงได้และพรีเซ็ตครบ 6 ธีม", async () => {
  const html = await readFile(new URL("../public/IT-Call-Skeuomorph.html", import.meta.url), "utf8");
  assert.match(html, /id="themePanelToggle"[^>]*aria-controls="themePanel"[^>]*aria-expanded="false"/);
  assert.match(html, /id="themePanel"[^>]*role="dialog"[^>]*aria-hidden="true"/);
  assert.match(html, /id="cardThemeStatus"[^>]*role="status"[^>]*aria-live="polite"/);
  assert.equal((html.match(/class="theme-preset/g) ?? []).length, 6);
  for (const theme of ["mint", "neon", "rose", "sunset", "netflix", "luxury"]) {
    assert.match(html, new RegExp(`data-theme="theme-${theme}"`));
  }
});

test("Custom Image ผูกกับ Hero และไม่มี body background mutation", async () => {
  const [html, script] = await Promise.all([
    readFile(new URL("../public/IT-Call-Skeuomorph.html", import.meta.url), "utf8"),
    readFile(new URL("../public/js/theme-system.js", import.meta.url), "utf8"),
  ]);
  assert.match(html, /id="cardThemePreview"/);
  assert.match(html, /id="cardGlassSurface"/);
  assert.match(script, /cardThemePreview/);
  assert.doesNotMatch(script, /document\.body\.style\.backgroundImage/);
  assert.match(script, /CustomEvent\("itcall:themechange"/);
});
```

- [ ] **Step 2: รัน test และยืนยันว่า fail เพราะ markup/controller ยังไม่มี**

Run: `node --test tests/theme-ui-contract.test.mjs`  
Expected: FAIL ที่ `themePanelToggle` และ `initThemeSystem` contract

- [ ] **Step 3: เพิ่มปุ่ม Header และ Theme Panel markup**

เพิ่มในกลุ่ม action ของ Header ก่อนปุ่มรีเฟรช:

```html
<button
  id="themePanelToggle"
  class="header-icon-button"
  type="button"
  aria-label="เปิดการตั้งค่าธีม"
  aria-controls="themePanel"
  aria-expanded="false"
>
  <i class="ph ph-palette" aria-hidden="true"></i>
  <span class="header-action-label">ธีม</span>
</button>
```

เพิ่มก่อน `<div id="toast">`:

```html
<div id="themePanelBackdrop" class="theme-panel-backdrop" hidden></div>
<aside id="themePanel" class="theme-panel" role="dialog"
       aria-labelledby="themePanelTitle" aria-modal="false" aria-hidden="true">
  <header class="theme-panel-header">
    <div><p class="theme-panel-kicker">CARD APPEARANCE</p><h2 id="themePanelTitle">ตกแต่งธีม Dashboard</h2></div>
    <button id="themePanelClose" type="button" class="icon-button" aria-label="ปิดการตั้งค่าธีม"><i class="ph ph-x"></i></button>
  </header>
  <div class="theme-panel-body">
    <fieldset class="theme-control-group">
      <legend>พรีเซ็ตสี</legend>
      <div class="theme-preset-grid">
        <button class="theme-preset preset-mint" data-theme="theme-mint" type="button">Mint</button>
        <button class="theme-preset preset-neon" data-theme="theme-neon" type="button">Neon</button>
        <button class="theme-preset preset-rose" data-theme="theme-rose" type="button">Rose</button>
        <button class="theme-preset preset-sunset" data-theme="theme-sunset" type="button">Sunset</button>
        <button class="theme-preset preset-netflix" data-theme="theme-netflix" type="button">Netflix</button>
        <button class="theme-preset preset-luxury" data-theme="theme-luxury" type="button">Luxury</button>
      </div>
    </fieldset>
    <div class="theme-control-group">
      <label for="cardGlassMode">โทน Glass</label>
      <select id="cardGlassMode"><option value="light">Light Glass</option><option value="dark">Dark Glass</option></select>
    </div>
    <div class="theme-control-group"><label for="cardOpacity">ความทึบ <output id="cardOpacityValue">88%</output></label><input id="cardOpacity" type="range" min="40" max="100" value="88"></div>
    <div class="theme-control-group"><label for="cardBlur">ความเบลอ <output id="cardBlurValue">12px</output></label><input id="cardBlur" type="range" min="0" max="30" value="12"></div>
    <div class="theme-control-group"><label class="upload-button" for="cardBackgroundImage">เลือกรูปพื้นหลัง Hero</label><input id="cardBackgroundImage" type="file" accept="image/*" hidden><button id="removeCardBackground" type="button" class="quiet-button">ลบรูปพื้นหลัง</button></div>
    <button id="appThemeToggle" type="button" class="secondary-button" aria-pressed="false">เปลี่ยนเป็น Light Glass</button>
    <button id="saveCardTheme" type="button" class="primary-button">บันทึกการตั้งค่า</button>
    <p id="cardThemeStatus" role="status" aria-live="polite"></p>
  </div>
</aside>
```

- [ ] **Step 4: เติม DOM controller ใน `theme-system.js`**

```js
function setStatus(documentLike, message) {
  const status = documentLike.getElementById("cardThemeStatus");
  if (status) status.textContent = message;
}

export function initThemeSystem({
  documentLike = document,
  windowLike = window,
  storage = window.localStorage,
} = {}) {
  const saved = loadCardPreferences(storage);
  const state = { ...saved, appThemeMode: loadAppThemeMode(storage), customImageData: null };
  const root = documentLike.body;
  const panel = documentLike.getElementById("themePanel");
  const toggle = documentLike.getElementById("themePanelToggle");
  const backdrop = documentLike.getElementById("themePanelBackdrop");
  const preview = documentLike.getElementById("cardThemePreview");
  const glass = documentLike.getElementById("cardGlassSurface");

  const render = () => {
    CARD_THEME_CONFIG.themes.forEach(theme => root.classList.remove(`app-${theme}`));
    root.classList.add(`app-${state.theme}`);
    root.classList.toggle("light-glass-theme", state.appThemeMode === "light");
    const opacity = state.opacity / 100;
    preview.style.backgroundImage = state.customImageData ? `url("${state.customImageData}")` : "";
    preview.dataset.theme = state.theme;
    glass.classList.toggle("is-dark", state.glassMode === "dark");
    glass.style.backgroundColor = state.glassMode === "light"
      ? `rgba(255, 255, 255, ${opacity})`
      : `rgba(2, 6, 23, ${opacity})`;
    glass.style.backdropFilter = `blur(${state.blur}px)`;
    glass.style.webkitBackdropFilter = `blur(${state.blur}px)`;
    documentLike.querySelectorAll(".theme-preset").forEach(button => {
      const active = button.dataset.theme === state.theme && !state.customImageData;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    documentLike.getElementById("cardGlassMode").value = state.glassMode;
    documentLike.getElementById("cardOpacity").value = String(state.opacity);
    documentLike.getElementById("cardBlur").value = String(state.blur);
    documentLike.getElementById("cardOpacityValue").textContent = `${state.opacity}%`;
    documentLike.getElementById("cardBlurValue").textContent = `${state.blur}px`;
    const appToggle = documentLike.getElementById("appThemeToggle");
    const isLight = state.appThemeMode === "light";
    appToggle.setAttribute("aria-pressed", String(isLight));
    appToggle.textContent = isLight ? "เปลี่ยนเป็น Dark Glass" : "เปลี่ยนเป็น Light Glass";
    windowLike.dispatchEvent(new windowLike.CustomEvent("itcall:themechange", { detail: { theme: state.theme } }));
  };

  const setPanelOpen = (open) => {
    panel.setAttribute("aria-hidden", String(!open));
    toggle.setAttribute("aria-expanded", String(open));
    backdrop.hidden = !open;
    documentLike.body.classList.toggle("theme-panel-open", open);
    if (open) documentLike.getElementById("themePanelClose").focus();
    else toggle.focus();
  };

  toggle.addEventListener("click", () => setPanelOpen(true));
  documentLike.getElementById("themePanelClose").addEventListener("click", () => setPanelOpen(false));
  backdrop.addEventListener("click", () => setPanelOpen(false));
  documentLike.addEventListener("keydown", event => { if (event.key === "Escape") setPanelOpen(false); });
  documentLike.querySelectorAll(".theme-preset").forEach(button => {
    button.addEventListener("click", () => {
      state.theme = button.dataset.theme;
      state.customImageData = null;
      if (state.theme === "theme-netflix") state.glassMode = "dark";
      render();
    });
  });
  documentLike.getElementById("cardOpacity").addEventListener("input", event => { state.opacity = Number(event.target.value); render(); });
  documentLike.getElementById("cardBlur").addEventListener("input", event => { state.blur = Number(event.target.value); render(); });
  documentLike.getElementById("cardGlassMode").addEventListener("change", event => { state.glassMode = event.target.value; render(); });
  documentLike.getElementById("appThemeToggle").addEventListener("click", () => {
    state.appThemeMode = state.appThemeMode === "light" ? "dark" : "light";
    try { saveAppThemeMode(storage, state.appThemeMode); }
    catch { setStatus(documentLike, "เปลี่ยนธีมได้ แต่ไม่สามารถบันทึกโหมดแอป"); }
    render();
  });
  documentLike.getElementById("cardBackgroundImage").addEventListener("change", event => {
    const file = event.target.files?.[0];
    const result = validateCustomImageFile(file);
    if (!result.ok) { setStatus(documentLike, result.message); event.target.value = ""; return; }
    const reader = new windowLike.FileReader();
    reader.addEventListener("load", loadEvent => {
      state.customImageData = loadEvent.target.result;
      render();
      setStatus(documentLike, "ใช้รูปพื้นหลังกับ Hero แล้ว");
    });
    reader.readAsDataURL(file);
  });
  documentLike.getElementById("removeCardBackground").addEventListener("click", () => {
    state.customImageData = null;
    documentLike.getElementById("cardBackgroundImage").value = "";
    render();
    setStatus(documentLike, "ลบรูปพื้นหลังแล้ว");
  });
  documentLike.getElementById("saveCardTheme").addEventListener("click", () => {
    try { saveCardPreferences(storage, state); setStatus(documentLike, "บันทึกการตั้งค่าแล้ว"); }
    catch { setStatus(documentLike, "เปลี่ยนธีมได้ แต่ไม่สามารถบันทึกการตั้งค่า"); }
  });
  render();
  return { state, render, setPanelOpen };
}
```

- [ ] **Step 5: รัน tests เฉพาะธีม**

Run: `node --test tests/theme-system.test.mjs tests/theme-ui-contract.test.mjs`  
Expected: PASS ทุก test, FAIL 0

- [ ] **Step 6: Commit Task 2**

```bash
git add public/IT-Call-Skeuomorph.html public/js/theme-system.js tests/theme-ui-contract.test.mjs
git commit -m "feat: add accessible dashboard theme controls"
```

---

### Task 3: จัด Desktop เป็น Command Ribbon และรักษา renderer contracts

**Files:**
- Modify: `public/IT-Call-Skeuomorph.html:72-292`
- Modify: `public/css/styles.css:1-296,568-615`
- Create: `tests/command-ribbon-layout.test.mjs`
- Modify: `tests/rendered-html.test.mjs`

**Interfaces:**
- Consumes: IDs ที่ `app.js` อัปเดต ได้แก่ `recordCount`, `monthSelector`, `totalTickets`, `topDept`, `topStaff`, `hrTableBody`, `hrTotal`, chart canvas IDs และ table IDs
- Produces: `#cardThemePreview.command-hero`, `#cardGlassSurface.command-hero-surface`, `.command-ribbon`, `.operations-grid`

- [ ] **Step 1: เขียน failing layout contract test**

```js
// tests/command-ribbon-layout.test.mjs
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("เรียง Hero, KPI, charts, HR และ log ตาม Command Ribbon", async () => {
  const html = await readFile(new URL("../public/IT-Call-Skeuomorph.html", import.meta.url), "utf8");
  const order = [
    'id="cardThemePreview"',
    'class="command-ribbon',
    'id="dailyChart"',
    'id="hrTableBody"',
    'id="tableBody"',
  ].map(token => html.indexOf(token));
  assert.ok(order.every(index => index >= 0));
  assert.deepEqual([...order].sort((a, b) => a - b), order);
});

test("รักษา ID ที่ renderer เดิมใช้งานครบ", async () => {
  const html = await readFile(new URL("../public/IT-Call-Skeuomorph.html", import.meta.url), "utf8");
  for (const id of [
    "recordCount", "monthSelector", "totalTickets", "topDept", "topStaff",
    "hrTableBody", "hrTotal", "dailyChart", "timeChart", "deptChart", "staffChart",
    "deptFilter", "searchInput", "tableBody", "tablePagination", "prevPageBtn", "nextPageBtn",
  ]) assert.match(html, new RegExp(`id="${id}"`));
});
```

- [ ] **Step 2: รัน test และยืนยันว่า fail ที่ Command Ribbon tokens**

Run: `node --test tests/command-ribbon-layout.test.mjs`  
Expected: FAIL เพราะยังไม่มี `cardThemePreview` และ `command-ribbon`

- [ ] **Step 3: จัด HTML Desktop ใหม่โดยรักษา ID เดิม**

ใช้โครงหลักนี้ภายใน `#desktop-layout` แล้ววาง table/thead/tbody เดิมลงในตำแหน่งที่ระบุ:

```html
<section id="cardThemePreview" class="command-hero" data-theme="theme-netflix">
  <div id="cardGlassSurface" class="command-hero-surface is-dark">
    <div class="command-hero-copy"><p class="command-kicker">OPERATIONAL OVERVIEW</p><h2>สถานการณ์งาน IT วันนี้</h2><p>ติดตามเคส แนวโน้ม และภาระงานจากข้อมูลชุดเดียว</p></div>
    <div class="command-hero-meta"><span id="currentDateHero"></span><span id="lastUpdatedHero">กำลังโหลดข้อมูล...</span></div>
  </div>
</section>

<section class="command-ribbon" aria-label="ตัวชี้วัดสำคัญ">
  <article class="command-metric"><span>Ticket ทั้งหมด</span><strong id="totalTickets">0</strong></article>
  <article class="command-metric"><span>แผนกที่แจ้งมากที่สุด</span><strong id="topDept">-</strong></article>
  <article class="command-metric"><span>ผู้รับเรื่องมากที่สุด</span><strong id="topStaff">-</strong></article>
  <article class="command-metric"><span>สถานะข้อมูล</span><strong class="api-status-badge">กำลังโหลด...</strong></article>
</section>

<section class="operations-grid">
  <article class="glass-card operations-trend"><header class="section-heading"><h3>แนวโน้มเคสรายวัน</h3></header><div class="chart-frame chart-frame-large"><canvas id="dailyChart"></canvas></div></article>
  <article class="glass-card operations-peak"><header class="section-heading"><h3>ช่วงเวลาพีก</h3></header><div class="chart-frame"><canvas id="timeChart"></canvas></div></article>
  <article class="glass-card operations-department"><header class="section-heading"><h3>ปัญหาแยกตามแผนก</h3></header><div class="chart-frame"><canvas id="deptChart"></canvas></div></article>
  <article class="glass-card operations-staff"><header class="section-heading"><h3>สัดส่วนผู้ปฏิบัติงาน</h3></header><div class="chart-frame"><canvas id="staffChart"></canvas></div></article>
</section>
```

วาง HR table เดิมหลัง `.operations-grid` และวาง Log table เดิมเป็น section สุดท้าย ห้ามเปลี่ยน ID, button classes หรือ CSV controls ภายในสอง section นี้

- [ ] **Step 4: เปลี่ยน CSS tokens และ Desktop layout**

```css
:root {
  --theme-primary: #e50914;
  --theme-primary-rgb: 229, 9, 20;
  --theme-canvas: #050506;
  --theme-canvas-deep: #020203;
  --theme-surface: rgba(18, 18, 20, 0.82);
  --theme-surface-strong: rgba(10, 10, 12, 0.94);
  --theme-text: #f8fafc;
  --theme-muted: #aeb6c4;
  --theme-line: rgba(255, 255, 255, 0.13);
  --theme-glow: 0 12px 36px rgba(229, 9, 20, 0.22);
  --radius-card: 18px;
}

body { background: var(--theme-canvas); color: var(--theme-text); }
.command-hero { padding: 1px; border-radius: 24px; background: radial-gradient(circle at 12% 0%, rgba(var(--theme-primary-rgb), .42), transparent 42%), linear-gradient(145deg, var(--theme-canvas-deep), var(--theme-canvas)); background-position: center; background-size: cover; }
.command-hero-surface { min-height: 180px; display: flex; justify-content: space-between; align-items: end; gap: 24px; padding: 28px; border: 1px solid var(--theme-line); border-radius: 23px; color: var(--theme-text); }
.command-ribbon { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; margin: 16px 0 24px; }
.command-metric { min-width: 0; min-height: 112px; padding: 18px; border: 1px solid var(--theme-line); border-radius: var(--radius-card); background: var(--theme-surface); }
.command-metric strong { display: block; margin-top: 8px; overflow: hidden; color: var(--theme-text); font: 700 1.5rem Kanit, sans-serif; text-overflow: ellipsis; white-space: nowrap; }
.operations-grid { display: grid; grid-template-columns: minmax(0, 1.35fr) minmax(320px, .65fr); gap: 18px; }
.operations-trend { grid-row: span 2; }
.chart-frame { position: relative; height: 260px; }
.chart-frame-large { height: 420px; }
```

เพิ่ม class `app-theme-*` ครบ 6 ธีมโดยกำหนด `--theme-primary`, `--theme-primary-rgb`, `--theme-canvas`, `--theme-canvas-deep`, `--theme-glow`; Light Glass เปลี่ยนเฉพาะ canvas/surface/text/line และคง Netflix เป็นพื้นดำ-แดงตามสเป็ก

- [ ] **Step 5: แก้ `rendered-html.test.mjs` ให้คาดหวัง Theme System ใหม่**

แทน assertion เดิม `assert.doesNotMatch(dashboard, /theme-toggle.../)` ด้วย:

```js
assert.match(dashboard, /id="themePanelToggle"/);
assert.match(dashboard, /id="cardThemePreview"/);
assert.match(dashboard, /data-theme="theme-netflix"/);
```

- [ ] **Step 6: รัน layout tests**

Run: `node --test tests/command-ribbon-layout.test.mjs tests/rendered-html.test.mjs`  
Expected: `rendered-html.test.mjs` อาจต้องมี `dist/` จาก build; ถ้าไม่มีให้รัน `npm run build` แล้วรันคำสั่งเดิมอีกครั้ง ทุก test ต้อง PASS

- [ ] **Step 7: Commit Task 3**

```bash
git add public/IT-Call-Skeuomorph.html public/css/styles.css tests/command-ribbon-layout.test.mjs tests/rendered-html.test.mjs
git commit -m "feat: redesign desktop dashboard as command ribbon"
```

---

### Task 4: แยก Touch Tablet/Mobile เป็น 4 แท็บและคง single scroller

**Files:**
- Modify: `public/IT-Call-Skeuomorph.html:294-445`
- Modify: `public/mobile-navigation.mjs`
- Modify: `public/js/mobile-view.js:15-105`
- Modify: `public/js/app.js:37-45,827-867`
- Modify: `public/css/styles.css:297-526`
- Modify: `tests/mobile-tab-order.test.mjs`
- Modify: `tests/ipad-air-hr-dashboard.test.mjs`
- Modify: `tests/ipad-air-fill.test.mjs`
- Modify: `tests/ipad-air-layout.test.mjs`

**Interfaces:**
- Produces: `MOBILE_TABS = ["dashboard", "team", "charts", "log"]`, section ID `mobile-section-team`, `setMobileTab("team")`
- Consumes: `mobileHRContainer`, `mobileHRSubtitle`, export HR button และ renderers เดิม

- [ ] **Step 1: เปลี่ยน tests เป็น contract 4 แท็บก่อน implementation**

```js
// ส่วนสำคัญใน tests/mobile-tab-order.test.mjs
assert.deepEqual(navigation.MOBILE_TABS, ["dashboard", "team", "charts", "log"]);
assert.deepEqual(
  [...html.matchAll(/data-tab="(dashboard|team|charts|log)"/g)].map(match => match[1]),
  ["dashboard", "team", "charts", "log"],
);
```

```js
// ส่วนสำคัญใน tests/ipad-air-hr-dashboard.test.mjs
const teamStart = html.indexOf('id="mobile-section-team"');
const hrContainer = html.indexOf('id="mobileHRContainer"');
const chartsStart = html.indexOf('id="mobile-section-charts"');
assert.ok(teamStart >= 0 && hrContainer > teamStart && chartsStart > hrContainer);
assert.match(html, /data-tab="team"[^>]*aria-controls="mobile-section-team"/);
```

แก้ `ipad-air-fill.test.mjs` ให้ selector single-scroller รวม `#mobile-section-team` และแก้ asset query assertions เป็น version วันที่ `20260816-1`

- [ ] **Step 2: รัน tests และยืนยันว่า fail ที่ลำดับแท็บ/Team section**

Run: `node --test tests/mobile-tab-order.test.mjs tests/ipad-air-hr-dashboard.test.mjs tests/ipad-air-fill.test.mjs tests/ipad-air-layout.test.mjs`  
Expected: FAIL เพราะ navigation ยังมี 3 แท็บและ HR ยังอยู่ Dashboard

- [ ] **Step 3: เปลี่ยน navigation modules เป็น 4 แท็บ**

```js
// public/mobile-navigation.mjs
export const MOBILE_TABS = ["dashboard", "team", "charts", "log"];
```

ใน `public/js/mobile-view.js` และ `public/js/app.js` เปลี่ยน section map เป็น:

```js
const sections = {
  dashboard: document.getElementById("mobile-section-dashboard"),
  team: document.getElementById("mobile-section-team"),
  charts: document.getElementById("mobile-section-charts"),
  log: document.getElementById("mobile-section-log"),
};
```

ทุกครั้งที่เปลี่ยนแท็บ ให้ sync `active`, `aria-selected`, `tabIndex`, `aria-hidden` และ scroll `#app-container` ไปด้านบน โดยรักษา reduced-motion logic เดิม

- [ ] **Step 4: ย้าย HR card ไป `mobile-section-team` และเพิ่ม nav item**

```html
<section id="mobile-section-team" class="hidden compact-section" aria-hidden="true">
  <article class="tablet-dashboard-hr-card glass-card">
    <header class="section-heading"><div><h3>ภาระงานทีม IT</h3><p id="mobileHRSubtitle"></p></div><button type="button" class="export-hr-btn secondary-button"><i class="ph ph-file-csv"></i> โหลด CSV</button></header>
    <div id="mobileHRContainer" class="mobile-report-list"></div>
  </article>
</section>
```

```html
<button type="button" class="mobile-nav-item" data-tab="team" role="tab"
        aria-selected="false" aria-controls="mobile-section-team" tabindex="-1">
  <i class="ph ph-users-three" aria-hidden="true"></i><span>ทีม IT</span>
</button>
```

จัด nav order เป็น Dashboard → Team IT → Charts → Log และปรับปุ่ม “ดูทั้งหมด” ใน Dashboard ให้เปิด `charts` เหมือนเดิม

- [ ] **Step 5: เขียน CSS Responsive ที่คง single scroller**

```css
@media (max-width: 1279px) {
  #app-container { height: 100dvh; min-height: 0; overflow-x: hidden; overflow-y: auto; }
  #desktop-layout { display: none; }
  #mobile-layout { display: block; width: 100%; max-width: 100vw; overflow: visible; touch-action: pan-y; }
  .compact-section { min-height: 100%; padding-bottom: calc(6rem + env(safe-area-inset-bottom, 0px)); }
  .mobile-bottom-nav { grid-template-columns: repeat(4, minmax(72px, 1fr)); overflow-x: auto; padding-bottom: max(8px, env(safe-area-inset-bottom)); }
  .theme-panel { inset: auto 0 0; width: 100%; max-height: 78dvh; border-radius: 22px 22px 0 0; transform: translateY(105%); }
  .theme-panel[aria-hidden="false"] { transform: translateY(0); }
}

@media (min-width: 768px) and (max-width: 1279px) {
  .mobile-metrics-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); }
  #mobile-section-dashboard:not(.hidden) { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
  #mobile-section-dashboard .mobile-metrics-grid { grid-column: 1 / -1; }
  .tablet-dashboard-chart-card { grid-column: 1 / -1; }
  #mobile-section-team:not(.hidden) { display: grid; grid-template-columns: minmax(0, 1fr); }
}

@media (max-width: 767px) {
  .mobile-metrics-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .command-hero-surface { min-height: 154px; padding: 18px; }
}
```

- [ ] **Step 6: รัน compact regression tests**

Run: `node --test tests/mobile-navigation.test.mjs tests/mobile-tab-order.test.mjs tests/mobile-card-sizing.test.mjs tests/mobile-metrics.test.mjs tests/mobile-reports.test.mjs tests/ipad-air-hr-dashboard.test.mjs tests/ipad-air-fill.test.mjs tests/ipad-air-layout.test.mjs`  
Expected: PASS ทุก test, FAIL 0

- [ ] **Step 7: Commit Task 4**

```bash
git add public/IT-Call-Skeuomorph.html public/mobile-navigation.mjs public/js/mobile-view.js public/js/app.js public/css/styles.css tests/mobile-tab-order.test.mjs tests/ipad-air-hr-dashboard.test.mjs tests/ipad-air-fill.test.mjs tests/ipad-air-layout.test.mjs
git commit -m "feat: add four-tab touch dashboard layout"
```

---

### Task 5: เชื่อม Theme init และทำ Chart.js ให้ตอบสนองต่อธีม

**Files:**
- Modify: `public/js/app.js:1-35,359-585,1171-1336,1342-1357`
- Modify: `public/IT-Call-Skeuomorph.html:28,456`
- Create: `tests/theme-integration.test.mjs`

**Interfaces:**
- Consumes: `initThemeSystem()` และ event `itcall:themechange` จาก Task 2
- Produces: `getChartTheme()`, chart refresh เมื่อธีมเปลี่ยน, cache-busting query `20260816-1`

- [ ] **Step 1: เขียน failing integration test**

```js
// tests/theme-integration.test.mjs
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("app เริ่ม Theme System และ refresh charts เมื่อธีมเปลี่ยน", async () => {
  const app = await readFile(new URL("../public/js/app.js", import.meta.url), "utf8");
  assert.match(app, /import \{ initThemeSystem \} from '\.\/theme-system\.js'/);
  assert.match(app, /initThemeSystem\(\)/);
  assert.match(app, /addEventListener\('itcall:themechange'/);
  assert.match(app, /function getChartTheme\(\)/);
});

test("HTML ใช้ asset version เดียวกัน", async () => {
  const html = await readFile(new URL("../public/IT-Call-Skeuomorph.html", import.meta.url), "utf8");
  assert.match(html, /styles\.css\?v=20260816-1/);
  assert.match(html, /app\.js\?v=20260816-1/);
});
```

- [ ] **Step 2: รัน test และยืนยันว่า fail ที่ import/init**

Run: `node --test tests/theme-integration.test.mjs`  
Expected: FAIL เพราะ `app.js` ยังไม่ import Theme System

- [ ] **Step 3: เชื่อม Theme System ใน `app.js`**

```js
import { fetchJsonWithRetry } from './fetch-resilience.js';
import { initThemeSystem } from './theme-system.js';

function getChartTheme() {
  const style = getComputedStyle(document.body);
  const primary = style.getPropertyValue('--theme-primary').trim() || '#e50914';
  const primaryRgb = style.getPropertyValue('--theme-primary-rgb').trim() || '229, 9, 20';
  return {
    primary,
    primarySoft: `rgba(${primaryRgb}, .18)`,
    text: style.getPropertyValue('--theme-muted').trim() || '#aeb6c4',
    grid: style.getPropertyValue('--theme-line').trim() || 'rgba(255,255,255,.13)',
  };
}
```

ใน `renderDailyChart`, `renderTimeChart`, `renderDeptChart` ใช้ `getChartTheme()` สำหรับ `borderColor`, `backgroundColor`, ticks และ grid; กราฟพนักงานคง `STAFF_COLORS` เพื่อรักษา identity แต่เปลี่ยน legend/ticks ให้ใช้ theme text

เพิ่มใน `bindEvents()`:

```js
window.addEventListener('itcall:themechange', () => {
  if (AppState.rawData.length > 0) {
    renderAllCharts(AppState.filteredData, AppState.activeMonthKey);
  }
});
```

และใน `initApp()` ใช้ลำดับ:

```js
bindEvents();
initThemeSystem();
setMobileTab('dashboard');
await fetchLiveData();
startAutoRefresh();
```

- [ ] **Step 4: Sync Hero status กับ header โดยไม่เปลี่ยนข้อมูลหลัก**

ใน `updateHeaderIndicators()` เขียนค่าเวลาเดียวกันให้ `lastUpdated` และ `lastUpdatedHero`; เขียนวันที่เดียวกันให้ `currentDate` และ `currentDateHero` โดยใช้ `textContent` เท่านั้น และคง `.api-status-badge` ทุก viewport ให้แสดง error/loading/success จาก `AppState`

- [ ] **Step 5: เปลี่ยน asset query versions**

```html
<link rel="stylesheet" href="./css/styles.css?v=20260816-1">
<script type="module" src="./js/app.js?v=20260816-1"></script>
```

- [ ] **Step 6: รัน theme integration และ API regression tests**

Run: `node --test tests/theme-system.test.mjs tests/theme-ui-contract.test.mjs tests/theme-integration.test.mjs tests/browser-timeout-regression.test.mjs tests/api-timeout-regression.test.mjs tests/mobile-api-resilience.test.mjs`  
Expected: PASS ทุก test, FAIL 0

- [ ] **Step 7: Commit Task 5**

```bash
git add public/js/app.js public/IT-Call-Skeuomorph.html tests/theme-integration.test.mjs
git commit -m "feat: sync dashboard charts with active theme"
```

---

### Task 6: ปิดงาน Accessibility, Full Regression และ Browser Matrix

**Files:**
- Modify if checks fail: `public/IT-Call-Skeuomorph.html`, `public/css/styles.css`, `public/js/theme-system.js`, relevant `tests/*.test.mjs`
- Evidence only: `git diff`, terminal test output และ screenshots ที่ viewport ที่กำหนด

**Interfaces:**
- Consumes: deliverables จาก Tasks 1–5
- Produces: verified build ที่ไม่มี horizontal overflow, keyboard trap หรือ regression

- [ ] **Step 1: ตรวจ source contracts แบบแคบก่อน**

Run:

```bash
node --test tests/theme-system.test.mjs tests/theme-ui-contract.test.mjs tests/command-ribbon-layout.test.mjs tests/theme-integration.test.mjs tests/mobile-navigation.test.mjs tests/mobile-tab-order.test.mjs tests/mobile-card-sizing.test.mjs tests/ipad-air-layout.test.mjs tests/ipad-air-fill.test.mjs tests/ipad-air-hr-dashboard.test.mjs
```

Expected: PASS ทุก test, FAIL 0

- [ ] **Step 2: รัน lint**

Run: `npm run lint`  
Expected: exit code 0 และไม่มี ESLint error

- [ ] **Step 3: รัน build**

Run: `npm run build`  
Expected: exit code 0 และสร้าง vinext build สำเร็จ

- [ ] **Step 4: รัน full regression suite**

Run: `npm test`  
Expected: exit code 0; tests ใต้ `tests/*.test.mjs` PASS ทั้งหมด

- [ ] **Step 5: เปิด local server และตรวจ browser matrix**

Run: `npm run dev` แล้วตรวจหน้า `/IT-Call-Skeuomorph.html` ด้วย viewport ต่อไปนี้:

| Viewport | Contract ที่ต้องยืนยัน |
|---|---|
| `360×800` | KPI 2 คอลัมน์, 4 tabs แตะได้, ไม่มี horizontal scroll, Bottom Sheet ไม่บังปุ่มบันทึก |
| `768×1024` | Touch Tablet 2 คอลัมน์, Team tab แสดง HR, single vertical scroller |
| `1024×768` | Touch Tablet landscape, 4 tabs, charts ไม่ล้นและ Drawer ยังเป็น Bottom Sheet |
| `1280×800` | Desktop Command Ribbon 4 KPI, operations grid และ Side Drawer |
| `1440×900` | Desktop spacing, table, HR และ charts ใช้พื้นที่สมดุล |

ในแต่ละ viewport ให้ตรวจ `document.documentElement.scrollWidth === document.documentElement.clientWidth`, เปิด/ปิดแผงธีม, เลือกครบ 6 presets, เปลี่ยน opacity/blur, toggle Light/Dark, กด Escape, tab ด้วย keyboard และ reload ค่าที่บันทึก

- [ ] **Step 6: ตรวจ Custom Image และ failure states ใน browser**

- เลือกรูป PNG/JPEG ต่ำกว่า 8MB: รูปต้องอยู่เฉพาะ `#cardThemePreview`
- เลือกไฟล์ไม่ใช่รูปและรูปใหญ่กว่า 8MB: ต้องเห็นข้อความใน `#cardThemeStatus`
- ลบรูป: Hero ต้องกลับพรีเซ็ตล่าสุด
- ทำ localStorage ให้เขียนไม่ได้: ธีมต้องเปลี่ยนใน session และแจ้งว่าไม่ได้บันทึก
- เปิด reduced motion emulation: animation/transition ต้องสั้นลงตาม media query

- [ ] **Step 7: ตรวจ diff และความสะอาดของ worktree**

Run:

```bash
git diff --check
git status --short
git diff --stat origin/main...HEAD
```

Expected: `git diff --check` ไม่มี output; ไม่มี lockfile, environment, `dist/`, `.superpowers/` หรือ generated files ถูก stage/commit

- [ ] **Step 8: Commit เฉพาะ fix จาก Verification ถ้ามี**

```bash
git add public/IT-Call-Skeuomorph.html public/css/styles.css public/js/theme-system.js public/js/app.js public/mobile-navigation.mjs public/js/mobile-view.js tests
git commit -m "fix: close responsive and accessibility regressions"
```

ถ้าไม่มีไฟล์เปลี่ยนหลัง Verification ให้ข้าม commit นี้และบันทึกหลักฐานคำสั่งที่ผ่านในรายงานส่งมอบ
