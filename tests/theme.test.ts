import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("dashboard theme", () => {
  it("uses the Frosted Ledger visual system", () => {
    const css = readFileSync(resolve(process.cwd(), "app/globals.css"), "utf8");

    for (const declaration of [
      "--primary: #1e56c8",
      "--secondary: #18b59b",
      "--tertiary: #d77d2c",
      "--background: #eeece6",
      "--surface: rgba(255, 255, 255, .58)",
      "--success: #18b59b",
      "--warning: #d77d2c",
      "--error: #b42318",
      "--info: #1e56c8",
      "--border: rgba(125, 143, 159, .42)",
    ]) {
      expect(css).toContain(declaration);
    }
    expect(css).toContain("family=DM+Sans");
    expect(css).toContain("family=IBM+Plex+Mono");
    expect(css).toContain("border-radius: 10px");
    expect(css).toContain("backdrop-filter: blur(14px)");
    expect(css).toContain("filter: blur(54px)");
    expect(css).not.toMatch(/gradient/i);
    expect(css).toContain(".kpi--1 { grid-column: span 2; color: var(--white); background: var(--primary)");
    expect(css).toContain(".kpi--5 { grid-column: span 2; background: rgba(248, 232, 215, .74)");
    expect(css).toContain(".ledger::before");
  });
});
