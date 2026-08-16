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
  const state = {
    ...saved,
    appThemeMode: loadAppThemeMode(storage),
    customImageData: null,
  };
  const root = documentLike.body;
  const panel = documentLike.getElementById("themePanel");
  const toggle = documentLike.getElementById("themePanelToggle");
  const backdrop = documentLike.getElementById("themePanelBackdrop");
  const preview = documentLike.getElementById("cardThemePreview");
  const glass = documentLike.getElementById("cardGlassSurface");
  if (!root || !panel || !toggle || !backdrop || !preview || !glass) return null;

  const render = () => {
    CARD_THEME_CONFIG.themes.forEach(theme => root.classList.remove(`app-${theme}`));
    root.classList.add(`app-${state.theme}`);
    root.classList.toggle("light-glass-theme", state.appThemeMode === "light");
    const opacity = state.opacity / 100;
    preview.style.backgroundImage = state.customImageData
      ? `url("${state.customImageData}")`
      : "";
    CARD_THEME_CONFIG.themes.forEach(theme => preview.classList.remove(theme));
    if (!state.customImageData) preview.classList.add(state.theme);
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
    const glassMode = documentLike.getElementById("cardGlassMode");
    const opacityInput = documentLike.getElementById("cardOpacity");
    const blurInput = documentLike.getElementById("cardBlur");
    if (glassMode) glassMode.value = state.glassMode;
    if (opacityInput) opacityInput.value = String(state.opacity);
    if (blurInput) blurInput.value = String(state.blur);
    const opacityValue = documentLike.getElementById("cardOpacityValue");
    const blurValue = documentLike.getElementById("cardBlurValue");
    if (opacityValue) opacityValue.textContent = `${state.opacity}%`;
    if (blurValue) blurValue.textContent = `${state.blur}px`;
    const appToggle = documentLike.getElementById("appThemeToggle");
    const isLight = state.appThemeMode === "light";
    if (appToggle) {
      appToggle.setAttribute("aria-pressed", String(isLight));
      appToggle.textContent = isLight ? "เปลี่ยนเป็น Dark Glass" : "เปลี่ยนเป็น Light Glass";
    }
    const CustomEventConstructor = windowLike.CustomEvent;
    if (typeof CustomEventConstructor === "function") {
      windowLike.dispatchEvent(new CustomEventConstructor("itcall:themechange", {
        detail: { theme: state.theme },
      }));
    }
  };

  const setPanelOpen = (open) => {
    panel.setAttribute("aria-hidden", String(!open));
    panel.setAttribute("aria-modal", String(open));
    toggle.setAttribute("aria-expanded", String(open));
    backdrop.hidden = !open;
    documentLike.body.classList.toggle("theme-panel-open", open);
    if (open) documentLike.getElementById("themePanelClose")?.focus();
    else toggle.focus();
  };

  toggle.addEventListener("click", () => setPanelOpen(true));
  documentLike.getElementById("themePanelClose")?.addEventListener("click", () => setPanelOpen(false));
  backdrop.addEventListener("click", () => setPanelOpen(false));
  documentLike.addEventListener("keydown", event => {
    if (event.key === "Escape" && panel.getAttribute("aria-hidden") === "false") setPanelOpen(false);
  });

  documentLike.querySelectorAll(".theme-preset").forEach(button => {
    button.addEventListener("click", () => {
      state.theme = button.dataset.theme;
      state.customImageData = null;
      if (state.theme === "theme-netflix") state.glassMode = "dark";
      render();
    });
  });
  documentLike.getElementById("cardOpacity")?.addEventListener("input", event => {
    state.opacity = Number(event.target.value);
    render();
  });
  documentLike.getElementById("cardBlur")?.addEventListener("input", event => {
    state.blur = Number(event.target.value);
    render();
  });
  documentLike.getElementById("cardGlassMode")?.addEventListener("change", event => {
    state.glassMode = event.target.value === "light" ? "light" : "dark";
    render();
  });
  documentLike.getElementById("appThemeToggle")?.addEventListener("click", () => {
    state.appThemeMode = state.appThemeMode === "light" ? "dark" : "light";
    try { saveAppThemeMode(storage, state.appThemeMode); }
    catch { setStatus(documentLike, "เปลี่ยนธีมได้ แต่ไม่สามารถบันทึกโหมดแอป"); }
    render();
  });
  documentLike.getElementById("cardBackgroundImage")?.addEventListener("change", event => {
    const file = event.target.files?.[0];
    const result = validateCustomImageFile(file);
    if (!result.ok) {
      setStatus(documentLike, result.message);
      event.target.value = "";
      return;
    }
    const reader = new windowLike.FileReader();
    reader.addEventListener("load", loadEvent => {
      state.customImageData = loadEvent.target.result;
      render();
      setStatus(documentLike, "ใช้รูปพื้นหลังกับ Hero แล้ว");
    });
    reader.readAsDataURL(file);
  });
  documentLike.getElementById("removeCardBackground")?.addEventListener("click", () => {
    state.customImageData = null;
    const input = documentLike.getElementById("cardBackgroundImage");
    if (input) input.value = "";
    render();
    setStatus(documentLike, "ลบรูปพื้นหลังแล้ว");
  });
  documentLike.getElementById("saveCardTheme")?.addEventListener("click", () => {
    try {
      saveCardPreferences(storage, state);
      setStatus(documentLike, "บันทึกการตั้งค่าแล้ว");
    } catch {
      setStatus(documentLike, "เปลี่ยนธีมได้ แต่ไม่สามารถบันทึกการตั้งค่า");
    }
  });

  render();
  return { state, render, setPanelOpen };
}
