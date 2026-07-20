import { describe, expect, it } from "vitest";
import { recipeSchema } from "./recipeSchema.js";

describe("recipeSchema", () => {
  it("recipe schema parses valid recipe", () => {
    const valid = {
      version: 1,
      recipeId: "test",
      name: "Test",
      description: "Test recipe",
      maturity: "beta",
      recommendedFor: [],
      commands: [],
      evidenceArtifacts: [],
      controls: [],
      limitations: []
    };
    expect(recipeSchema.safeParse(valid).success).toBe(true);
  });
  
  it("invalid recipe is rejected", () => {
    expect(recipeSchema.safeParse({}).success).toBe(false);
  });
});
