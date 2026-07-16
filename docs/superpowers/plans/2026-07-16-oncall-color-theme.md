# IT On-call Color Theme Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the attached editorial-bento color palette to the existing IT On-call dashboard and provide a local browser preview without publishing it.

**Architecture:** Keep the React UI and all behavior unchanged. Treat `app/globals.css` as the sole production theme surface, verify its semantic CSS tokens with a focused Vitest test, then run the full suite and production build before opening the local preview.

**Tech Stack:** React 19, Next.js 16, vinext, CSS custom properties, Vitest

## Global Constraints

- Preserve the current React components, layout, copy, data flow, interactions, responsive behavior, access settings, external endpoints, and social-preview image.
- Use the attached palette exactly: paper `#f2f0e9`, ink `#14202b`, petrol `#123d46`, signal `#f05a36`, cyan `#249bb1`, rule `#c8c5bb`, chalk `#fffdf7`, muted `#667076`, amber `#9b6500`, and red `#9a3444`.
- Do not publish a Sites version until the user approves the preview.

---

### Task 1: Theme token regression test and CSS update

**Files:**
- Create: `tests/theme.test.ts`
- Modify: `app/globals.css`

**Interfaces:**
- Consumes: the semantic CSS custom properties declared in `app/globals.css`.
- Produces: a reference-aligned palette used by all existing dashboard selectors.

- [ ] **Step 1: Write the failing test**

```ts
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("dashboard theme", () => {
  it("uses the attached editorial-bento palette", () => {
    const css = readFileSync(resolve(process.cwd(), "app/globals.css"), "utf8");
    for (const declaration of [
      "--paper:#f2f0e9",
      "--ink:#14202b",
      "--petrol:#123d46",
      "--signal:#f05a36",
      "--cyan:#249bb1",
      "--rule:#c8c5bb",
      "--chalk:#fffdf7",
      "--muted:#667076",
      "--amber:#9b6500",
      "--red:#9a3444",
    ]) {
      expect(css).toContain(declaration);
    }
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- tests/theme.test.ts`

Expected: FAIL because the current theme does not contain the exact reference declarations.

- [ ] **Step 3: Apply the minimal theme update**

Replace the `:root` palette in `app/globals.css` with the exact declarations in Step 1, retain `--petrol-deep` as the existing darker hierarchy role, and map `--white` to `var(--chalk)` for compatibility. Replace supporting hard-coded neutral colors with the new semantic variables only where an existing selector needs the reference palette.

- [ ] **Step 4: Run the focused test to verify it passes**

Run: `npm test -- tests/theme.test.ts`

Expected: one test file passes with zero failures.

- [ ] **Step 5: Commit the theme change**

```bash
git add app/globals.css tests/theme.test.ts
git commit -m "style: apply editorial bento color theme"
```

### Task 2: Validate and open the unpublished preview

**Files:**
- Verify: `app/globals.css`
- Verify: `tests/theme.test.ts`

**Interfaces:**
- Consumes: the completed theme change from Task 1.
- Produces: a validated local preview URL for user review.

- [ ] **Step 1: Run the complete automated test suite**

Run: `npm test`

Expected: all test files pass with zero failures.

- [ ] **Step 2: Run the production build**

Run: `npm run build`

Expected: exit code 0 and a complete vinext build.

- [ ] **Step 3: Review the final diff**

Run: `git diff HEAD^ -- app/globals.css tests/theme.test.ts`

Expected: only theme declarations, dependent theme colors, and the focused theme test changed.

- [ ] **Step 4: Start the local development preview**

Run: `npm run dev`

Expected: the development server prints a healthy Local URL.

- [ ] **Step 5: Open the exact Local URL in the Codex browser**

Open the printed Local URL once and leave the server running so the user can inspect the preview. Do not save or deploy a Sites version.
