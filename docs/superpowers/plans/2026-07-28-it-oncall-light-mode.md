# IT On-call Light Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an accessible, persistent light mode to the existing Liquid Glass IT on-call compensation dashboard without changing its data behavior.

**Architecture:** Keep theme state in the existing client dashboard, expose a small pure helper module for validation/toggle labels, and drive the visual change through semantic CSS variables on `html[data-theme]`. The server-rendered page remains dark by default for stable hydration, while the client applies a stored theme after mount.

**Tech Stack:** Next/Vinext, React client component, TypeScript/TSX, CSS custom properties, Node test runner, in-app browser.

## Global Constraints

- Dark mode remains the default fallback.
- No new dependency is added.
- Theme preference is stored under `it-oncall-compensation-theme` and only accepts `dark` or `light`.
- Toggle controls must be keyboard accessible, at least 44×44px, and expose `aria-pressed`.
- Existing data/filter/export/refresh behavior must remain unchanged.
- Responsive checks must include 1440, 1024, 768 and 375px with no horizontal overflow.

---

### Task 1: Add the failing theme behavior tests

**Files:**
- Create: `tests/theme.test.mjs`
- Test: `lib/theme.mjs` (imported before it exists)

**Interfaces:**
- Expected exports: `THEME_STORAGE_KEY`, `isTheme(value)`, `nextTheme(theme)`, `themeToggleLabel(theme)`.

- [ ] **Step 1: Write the failing tests**

```js
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
```

- [ ] **Step 2: Run the focused test to verify RED**

Run: `node --test tests/theme.test.mjs`

Expected: FAIL because `lib/theme.mjs` does not exist yet.

### Task 2: Implement the theme state and toggle

**Files:**
- Create: `lib/theme.mjs`
- Modify: `app/page.tsx` near the imports, state declarations, and topbar actions
- Modify: `tests/rendered-html.test.mjs`

**Interfaces:**
- `lib/theme.mjs` returns the exact theme helper exports from Task 1.
- The topbar button uses `aria-pressed`, `aria-label`, and visible action text from `themeToggleLabel(theme)`.

- [ ] **Step 1: Implement the minimal helper module**

```js
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
```

- [ ] **Step 2: Run the focused test to verify GREEN**

Run: `node --test tests/theme.test.mjs`

Expected: 3 passing tests, 0 failures.

- [ ] **Step 3: Add client theme state**

In `app/page.tsx`, import the helpers and add `const [theme, setTheme] = useState<Theme>("dark")`. On mount, read `window.localStorage.getItem(THEME_STORAGE_KEY)`, accept it only when `isTheme` returns true, and apply it to `document.documentElement.dataset.theme`. The click handler computes `nextTheme(theme)`, updates state, applies the dataset immediately, and persists the new value.

- [ ] **Step 4: Add the accessible topbar control**

Place a `.theme-toggle` button in `.topbar-actions` before the refresh button. It must include a non-emoji CSS icon span, visible action text, `aria-label={themeToggleLabel(theme)}`, `aria-pressed={theme === "light"}`, and a `title` matching the action label.

- [ ] **Step 5: Extend the render test**

Assert the response HTML contains `LOCAL PREVIEW`, `อัปเดตข้อมูล`, and the theme toggle marker/class, while retaining the existing starter-removal assertions.

### Task 3: Add light Liquid Glass tokens and responsive styling

**Files:**
- Modify: `app/globals.css`

**Interfaces:**
- Dark mode keeps the current visual output.
- `html[data-theme="light"]` overrides the same semantic variables and component surfaces without changing markup.

- [ ] **Step 1: Define semantic visual tokens**

Replace component-specific dark-only raw backgrounds/borders with variables for shell gradients, glass surfaces, inputs, metric cards, tracks, notices, table dividers, tags, and shadows. Keep the current values as the dark defaults.

- [ ] **Step 2: Add the light token layer**

Add `html[data-theme="light"]` variables for an ivory/blue-gray canvas, white translucent glass, navy text, readable muted/faint text, stronger blue/green accents, light shadows, and lower-opacity ambient orbs. Ensure the primary KPI and warning KPI remain visually distinct.

- [ ] **Step 3: Style the toggle**

Add a 44px minimum theme button with a compact CSS icon, label, focus/hover/active states, and light-mode surface overrides. Keep topbar wrapping rules intact at 820px and 600px.

- [ ] **Step 4: Preserve reduced motion**

Add the theme transition only to color/background/border/shadow properties and keep it disabled under the existing reduced-motion media query.

### Task 4: Verify the feature and local preview

**Files:**
- Modify: `tests/rendered-html.test.mjs` only if a final assertion needs tightening

- [ ] **Step 1: Run the full automated verification**

Run: `node --test tests/theme.test.mjs tests/rendered-html.test.mjs tests/dashboard-data.test.mjs`

Expected: all tests pass with 0 failures.

- [ ] **Step 2: Run lint and build with the bundled Node runtime**

Run ESLint with the bundled Node path, then run `vinext build`.

Expected: exit code 0 and no lint errors.

- [ ] **Step 3: Exercise the browser interaction**

At `http://localhost:3000/`, verify the theme button changes `html[data-theme]`, its `aria-pressed` and label update, and `localStorage.getItem("it-oncall-compensation-theme")` matches. Reload once and verify the selected theme persists.

- [ ] **Step 4: Check responsive geometry and visual states**

Set 1440px and 375px viewports, capture screenshots, and assert `document.documentElement.scrollWidth === document.documentElement.clientWidth` in both themes. Confirm filter, refresh, export, and event-list behavior still works after toggling.
