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
    opacity: clampNumber(source.opacity, CARD_THEME_CONFIG.limits.opacity.min, CARD_THEME_CONFIG.limits.opacity.max, defaults.opacity),
    blur: clampNumber(source.blur, CARD_THEME_CONFIG.limits.blur.min, CARD_THEME_CONFIG.limits.blur.max, defaults.blur),
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
    return mode === "light" || mode === "dark" ? mode : CARD_THEME_CONFIG.defaults.appThemeMode;
  } catch {
    return CARD_THEME_CONFIG.defaults.appThemeMode;
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
