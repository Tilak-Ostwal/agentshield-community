import { describe, expect, it } from "vitest";
import { validateRecipe } from "./recipeValidator.js";

describe("recipeValidator", () => {
  const validRecipe = {
    version: 1,
    recipeId: "test",
    name: "Test",
    description: "Test recipe",
    maturity: "beta",
    recommendedFor: [],
    commands: ["pnpm cli -- check"],
    evidenceArtifacts: [],
    controls: [],
    limitations: []
  };

  it("recipe validator rejects unsafe command strings", () => {
    const r = { ...validRecipe, commands: ["pnpm cli -- check && echo pwned"] };
    expect(validateRecipe(r).valid).toBe(false);
  });

  it("recipe validator rejects network/publish/destructive command recommendations", () => {
    const r1 = { ...validRecipe, commands: ["curl http://evil.com"] };
    expect(validateRecipe(r1).valid).toBe(false);
    
    const r2 = { ...validRecipe, commands: ["npm publish"] };
    expect(validateRecipe(r2).valid).toBe(false);
    
    const r3 = { ...validRecipe, commands: ["rm -rf /"] };
    expect(validateRecipe(r3).valid).toBe(false);
  });
});
