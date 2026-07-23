import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("dashboard theme", () => {
  it("uses the MiniDash visual system", () => {
    const css = readFileSync(resolve(process.cwd(), "app/globals.css"), "utf8");

    for (const declaration of [
      "--primary:#1D4ED8",
      "--secondary:#06B6D4",
      "--tertiary:#F59E0B",
      "--background:#EEF6FF",
      "--surface:#FFFFFF",
      "--success:#10B981",
      "--warning:#F59E0B",
      "--error:#EF4444",
      "--info:#1D4ED8",
      "--border:#D6E4F5",
    ]) {
      expect(css).toContain(declaration);
    }
    expect(css).toContain("family=Inter");
    expect(css).toContain("family=DM+Sans");
    expect(css).toContain("family=IBM+Plex+Mono");
    expect(css).toContain("border-radius:8px");
    expect(css).toContain("--shadow-subtle:0 1px 2px rgba(16,42,67,.04)");
    expect(css).toContain(".kpi--1 { grid-column:span 2; color:var(--surface); background:var(--primary)");
    expect(css).toContain(".kpi--5 { grid-column:span 2; background:var(--tertiary)");
    expect(css).toContain(".ledger::before");
  });
});
