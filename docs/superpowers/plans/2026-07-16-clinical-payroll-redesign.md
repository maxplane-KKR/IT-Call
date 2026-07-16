# Clinical Payroll Dashboard Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle the existing IT On-call dashboard as the approved Clinical Payroll Sheet, validate it at desktop and mobile sizes, and publish it to the existing Sites URL.

**Architecture:** Preserve the React component tree, props, data flow, and behavior. Implement the redesign in `app/globals.css`, keep a focused stylesheet regression test in `tests/theme.test.ts`, refresh the existing social card, and deploy the validated branch through Sites.

**Tech Stack:** React 19, Next.js 16, vinext, CSS custom properties, Vitest, Sites

## Global Constraints

- Preserve content hierarchy, component positions, metrics, calculations, business rules, workflows, routes, access, and integrations.
- Use the approved tokens: `#f8fbfd`, `#eef3f7`, `#102438`, `#0759c7`, `#dfefff`, `#8aa4ba`, `#ffd43b`, `#ea3150`, `#ffffff`, and `#5d7286`.
- Use `IBM Plex Sans Thai`, `Noto Serif Thai`, and `IBM Plex Mono` with system fallbacks.
- Keep interactive targets at least 44 pixels, preserve keyboard focus, and respect reduced motion.
- Do not change component behavior or business copy.
- Publish only after tests, build, and browser QA succeed.

---

### Task 1: Clinical Payroll visual system

**Files:**
- Modify: `tests/theme.test.ts`
- Modify: `app/globals.css`

**Interfaces:**
- Consumes: existing semantic class names from `dashboard-sections.tsx`.
- Produces: the complete approved visual system without changing component props or behavior.

- [ ] **Step 1: Update the focused test for the approved direction**

```ts
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("dashboard theme", () => {
  it("uses the approved Clinical Payroll Sheet visual system", () => {
    const css = readFileSync(resolve(process.cwd(), "app/globals.css"), "utf8");
    for (const declaration of [
      "--paper:#f8fbfd",
      "--field:#eef3f7",
      "--ink:#102438",
      "--blue:#0759c7",
      "--blue-soft:#dfefff",
      "--rule:#8aa4ba",
      "--yellow:#ffd43b",
      "--red:#ea3150",
      "--white:#ffffff",
      "--muted:#5d7286",
    ]) expect(css).toContain(declaration);
    expect(css).toContain('family=IBM+Plex+Mono');
    expect(css).toContain('family=IBM+Plex+Sans+Thai');
    expect(css).toContain('family=Noto+Serif+Thai');
    expect(css).toContain('.kpi--1 { grid-column:span 2; color:var(--white); background:var(--blue)');
    expect(css).toContain('.kpi--5 { grid-column:span 2; background:var(--yellow)');
    expect(css).toContain('.ledger::before');
  });
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run: `node_modules/.bin/vitest.cmd run tests/theme.test.ts`

Expected: FAIL because the current editorial-bento tokens and selectors do not match the approved Clinical Payroll Sheet values.

- [ ] **Step 3: Implement the stylesheet**

Replace the stylesheet token and typography foundation with:

```css
@import url("https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@500;600;700&family=IBM+Plex+Sans+Thai:wght@400;500;600;700&family=Noto+Serif+Thai:ital,wght@1,600;1,700&display=swap");
@import "tailwindcss";

:root { --paper:#f8fbfd; --field:#eef3f7; --ink:#102438; --blue:#0759c7; --blue-soft:#dfefff; --rule:#8aa4ba; --yellow:#ffd43b; --red:#ea3150; --white:#ffffff; --muted:#5d7286; }
body { background:var(--field); color:var(--ink); font-family:"IBM Plex Sans Thai","Leelawadee UI",Tahoma,sans-serif; }
.countdown,.rates dd,.kpi p,.section-heading p { font-family:"IBM Plex Mono",Consolas,monospace; }
h1 em { color:var(--blue); font-family:"Noto Serif Thai",Georgia,serif; font-style:italic; }
```

Apply these exact component treatments while retaining the current layout selectors and breakpoints:

```css
.masthead { color:var(--ink); background:var(--paper); border-top:14px solid var(--blue); border-bottom:1px solid var(--rule); }
.masthead__identity { border-right:1px solid var(--rule); }
.duty-board { background:var(--blue-soft); border-left:0; }
.live-dot { background:var(--blue); box-shadow:0 0 0 5px rgba(7,89,199,.12); }
.button--signal { color:var(--white); background:var(--blue); box-shadow:3px 3px 0 var(--rule); }
.filters { gap:10px; background:transparent; border:0; }
.filter,.kpi,.analysis,.ledger { background:var(--white); border:1px solid var(--rule); }
.kpi-grid { gap:10px; background:transparent; border:0; }
.kpi--1 { grid-column:span 2; color:var(--white); background:var(--blue); border-color:var(--blue); }
.kpi--5 { grid-column:span 2; background:var(--yellow); border-color:#b99100; color:var(--ink); }
.analysis { box-shadow:4px 4px 0 rgba(138,164,186,.48); }
.section-heading { border-bottom:2px solid var(--blue); }
.bar i,th { background:var(--blue); }
.ledger { position:relative; border-top:1px solid var(--rule); }
.ledger::before { position:absolute; inset:-1px auto -1px -1px; width:9px; content:""; background:var(--red); }
.restricted { color:#7d1c2f; background:#fde9ed; border-left:4px solid var(--red); }
```

Keep existing responsive grid collapses, horizontal table scrolling, focus styles, and reduced-motion behavior. Adjust only palette, type, borders, shadows, and spacing necessary to match the approved full-page preview.

- [ ] **Step 4: Run the focused test and verify GREEN**

Run: `node_modules/.bin/vitest.cmd run tests/theme.test.ts`

Expected: one test file passes with zero failures.

- [ ] **Step 5: Commit the redesign**

```bash
git add app/globals.css tests/theme.test.ts
git commit -m "style: redesign dashboard as clinical payroll sheet"
```

### Task 2: Matching social preview

**Files:**
- Modify: `public/og.png`

**Interfaces:**
- Consumes: approved Clinical Payroll Sheet color, type, and audit-rule language.
- Produces: a 1200×630 social card already referenced by `app/layout.tsx`.

- [ ] **Step 1: Generate exactly one project-bound social card**

Use the built-in image generator with this prompt:

```text
Use case: productivity-visual
Asset type: 1200×630 social preview card for an IT on-call compensation dashboard
Primary request: Create a polished editorial audit-sheet social card matching the finished Clinical Payroll Sheet dashboard.
Composition: landscape, cobalt top rule, cool white document field, compact audit grid, one cobalt compensation block, one yellow cap-adjustment block, and a restrained red restricted-record spine.
Text (verbatim): "IT On-call" and "Compensation Dashboard"
Typography: bold Thai-compatible sans/mono-inspired data styling with an italic serif treatment only for “On-call”.
Color palette: #F8FBFD, #EEF3F7, #102438, #0759C7, #FFD43B, #EA3150, #8AA4BA.
Constraints: highly legible at link-unfurl size; no browser chrome, device frame, logo, watermark, photo, people, decorative illustration, invented metrics, or extra text.
```

- [ ] **Step 2: Inspect and validate the generated text**

Expected: both required phrases are spelled exactly; no invented copy, logo, or watermark appears. Retry once only if unusable.

- [ ] **Step 3: Save the validated asset**

Copy the selected generated image to `public/og.png`, preserving PNG format.

- [ ] **Step 4: Commit the card**

```bash
git add public/og.png
git commit -m "style: refresh clinical payroll social preview"
```

### Task 3: Validate, preview, and publish

**Files:**
- Verify: `app/globals.css`
- Verify: `tests/theme.test.ts`
- Verify: `public/og.png`
- Verify: `.openai/hosting.json`

**Interfaces:**
- Consumes: the validated redesign and social card.
- Produces: a deployed Sites version at the existing project URL.

- [ ] **Step 1: Run the complete test suite**

Run: `node_modules/.bin/vitest.cmd run`

Expected: all test files pass with zero failures.

- [ ] **Step 2: Run the production build**

Run: `node_modules/.bin/vinext.cmd build`

Expected: exit code 0 and a complete five-stage vinext build.

- [ ] **Step 3: Review source changes**

Run: `git status --short` and `git diff HEAD~2 -- app/globals.css tests/theme.test.ts app/layout.tsx`

Expected: no uncommitted source changes and no behavior or data-flow modifications.

- [ ] **Step 4: Perform requested browser QA**

Start the local production preview, verify the exact CSS assets load, and inspect the dashboard at desktop and mobile widths. Confirm the approved cobalt, cool paper, yellow cap card, red ledger spine, responsive order, and visible focus styles.

- [ ] **Step 5: Push the validated source state**

Push the feature branch's exact head commit to the existing Sites source repository using a short-lived per-command authorization header.

- [ ] **Step 6: Package and save one Sites version**

Use the Sites packaging helper and save a version referencing the pushed head commit.

- [ ] **Step 7: Deploy and poll to terminal success**

Deploy the saved version to the existing public Sites project and poll until the deployment reports `succeeded`.

- [ ] **Step 8: Open the deployed URL and report it**

Open the exact deployed URL in the Codex browser and return the URL as the primary deliverable.
