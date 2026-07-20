import { describe, expect, it } from "vitest";
import { formatRecipeMarkdown } from "./recipeReport.js";

describe("recipeReport", () => {
  it("recipe report Markdown works", () => {
    const md = formatRecipeMarkdown({
      version: 1,
      recipeId: "test",
      name: "Test",
      description: "Test recipe",
      maturity: "beta",
      recommendedFor: ["ci"],
      commands: ["cmd"],
      evidenceArtifacts: [],
      controls: [{ controlId: "ID", name: "Name", coveredBy: [], evidence: [], limitations: [] }],
      limitations: []
    });
    expect(md).toContain("Recipe: Test");
    expect(md).toContain("cmd");
    expect(md).toContain("ID");
  });
});
