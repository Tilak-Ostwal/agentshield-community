import { describe, it, expect } from "vitest";
import { corpusScenarioMetadataSchema } from "./corpusScenarioMetadata.js";

describe("corpusScenarioMetadata", () => {
  it("parses valid metadata", () => {
    const data = {
      version: 4, scenarioId: "test-001", title: "Test", category: "prompt_injection",
      family: "prompt_injection_secret_exfiltration", severity: "critical", difficulty: "basic",
      expectedFinalDecision: "deny", expectedRiskMarkers: [], attackStages: [], controlsExercised: [],
      provenance: { source: "src", createdBy: "user", createdAt: "2026-06-29T00:00:00.000Z", reviewStatus: "reviewed", notes: [] },
      limitations: ["No real secrets"]
    };
    expect(corpusScenarioMetadataSchema.safeParse(data).success).toBe(true);
  });
  it("rejects invalid metadata", () => {
    expect(corpusScenarioMetadataSchema.safeParse({ version: 3 }).success).toBe(false);
  });
});
