import { describe, expect, it } from "vitest";
import { checkRecipeDoctor } from "./recipeDoctor.js";
import { builtInRecipes } from "./builtInRecipes.js";

describe("recipeDoctor", () => {
  const root = process.cwd();

  it("recipe doctor finds missing required references", () => {
    const doc = checkRecipeDoctor({
      ...builtInRecipes["full-release-candidate"]!,
      commands: ["cmd some/missing/file.json"]
    }, root);
    expect(doc.warnings.length).toBeGreaterThan(0);
  });

  it("recipe doctor passes when no files referenced", () => {
    const doc = checkRecipeDoctor({
      ...builtInRecipes["full-release-candidate"]!,
      commands: ["pnpm cli -- check"]
    }, root);
    expect(doc.ok).toBe(true);
  });
});
