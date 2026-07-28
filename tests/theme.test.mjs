import test from "node:test";
import assert from "node:assert/strict";
import {
  THEME_STORAGE_KEY,
  isTheme,
  nextTheme,
  themeToggleLabel,
} from "../lib/theme.mjs";

test("accepts only persisted dashboard themes", () => {
  assert.equal(THEME_STORAGE_KEY, "it-oncall-compensation-theme");
  assert.equal(isTheme("dark"), true);
  assert.equal(isTheme("light"), true);
  assert.equal(isTheme("system"), false);
  assert.equal(isTheme(null), false);
});

test("toggles between dark and light", () => {
  assert.equal(nextTheme("dark"), "light");
  assert.equal(nextTheme("light"), "dark");
});

test("describes the action the theme button will take", () => {
  assert.equal(themeToggleLabel("dark"), "โหมดสว่าง");
  assert.equal(themeToggleLabel("light"), "โหมดมืด");
});
