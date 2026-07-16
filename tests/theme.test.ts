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
    ]) {
      expect(css).toContain(declaration);
    }
    expect(css).toContain("family=IBM+Plex+Mono");
    expect(css).toContain("family=IBM+Plex+Sans+Thai");
    expect(css).toContain("family=Noto+Serif+Thai");
    expect(css).toContain(".kpi--1 { grid-column:span 2; color:var(--white); background:var(--blue)");
    expect(css).toContain(".kpi--5 { grid-column:span 2; background:var(--yellow)");
    expect(css).toContain(".ledger::before");
  });
});
