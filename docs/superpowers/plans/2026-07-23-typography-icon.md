# Typography Circle Icon Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the headset favicon with the selected Editorial stack typography icon: a blue circle with large `IT`, a yellow slash, and `ON-CALL` beneath it.

**Architecture:** Keep the existing metadata routes and filenames unchanged. Use one source SVG for the browser favicon and render the same SVG into the existing PNG sizes used by the manifest and Apple touch metadata.

**Tech Stack:** SVG, Node.js, Sharp, Vitest/Node test, vinext build, Sites hosting.

## Global Constraints

- Preserve `/favicon.svg`, `/icon-192.png`, `/icon-512.png`, `/icon-1024.png`, and `/apple-touch-icon.png` URLs.
- Keep the icon typography centered inside a circular silhouette with no text touching the edge.
- Do not change dashboard data logic or layout.

### Task 1: Define the new icon contract in the regression test

**Files:**
- Modify: `tests/favicon.test.mjs`
- Test: `tests/favicon.test.mjs`

- [ ] Update the favicon assertion to require `data-icon="editorial-stack"`, a circular `cx="256" cy="256"` background, exact `IT`, `/`, and `ON-CALL` text, and no `headset` marker.
- [ ] Run `node --test tests/favicon.test.mjs` and confirm it fails because the current favicon still contains the headset concept.

### Task 2: Implement the selected SVG and regenerate the PNG icon family

**Files:**
- Modify: `public/favicon.svg`
- Modify: `public/icon-192.png`
- Modify: `public/icon-512.png`
- Modify: `public/icon-1024.png`
- Modify: `public/apple-touch-icon.png`

- [ ] Replace the headset group with a centered circle and typography stack using the existing dashboard palette: `#0759C7`, `#FFD43B`, and white.
- [ ] Render the SVG into 192, 512, 1024, and 180 pixel PNGs with the repository's installed `sharp` package.
- [ ] Run the targeted favicon test and confirm it passes.

### Task 3: Validate and publish

**Files:**
- Inspect: `.openai/hosting.json`
- Inspect: `dist/` after build

- [ ] Run `npm test -- --runInBand` and `npm run build` from the site directory; fix only failures caused by this change.
- [ ] Inspect the generated SVG and PNG dimensions and confirm the build emits the icon assets.
- [ ] Commit the validated source, push the existing Sites project branch, package, save a version, deploy privately, and poll until deployment succeeds.
