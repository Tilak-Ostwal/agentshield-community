import { describe, expect, it } from "vitest";
import { builtInRecipes } from "./builtInRecipes.js";

describe("builtInRecipes", () => {
  it("built-in recipe list includes all required recipes", () => {
    expect(builtInRecipes["ci-security-gate"]).toBeDefined();
    expect(builtInRecipes["mcp-proxy-protection"]).toBeDefined();
    expect(builtInRecipes["sdk-runtime-guard"]).toBeDefined();
    expect(builtInRecipes["adapter-certification"]).toBeDefined();
    expect(builtInRecipes["auditor-evidence-pack"]).toBeDefined();
    expect(builtInRecipes["incident-response"]).toBeDefined();
    expect(builtInRecipes["full-release-candidate"]).toBeDefined();
  });

  it("full-release-candidate includes required advanced checks", () => {
    const frc = builtInRecipes["full-release-candidate"]!;
    expect(frc.requires!.securityFuzz).toBe(true);
    expect(frc.commands.find(c => c.includes("security-fuzz"))).toBeDefined();
    expect(frc.controls.length).toBeGreaterThan(0);
  });

  it("every built-in recipe maps to at least one control", () => {
    for (const r of Object.values(builtInRecipes)) {
      expect(r.controls.length).toBeGreaterThan(0);
    }
  });
});
