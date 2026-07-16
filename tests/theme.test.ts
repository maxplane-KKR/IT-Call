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
