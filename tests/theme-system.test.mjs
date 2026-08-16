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
