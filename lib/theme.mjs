export const THEME_STORAGE_KEY = "it-oncall-compensation-theme";

export function isTheme(value) {
  return value === "dark" || value === "light";
}

export function nextTheme(theme) {
  return theme === "light" ? "dark" : "light";
}

export function themeToggleLabel(theme) {
  return theme === "light" ? "โหมดมืด" : "โหมดสว่าง";
}
