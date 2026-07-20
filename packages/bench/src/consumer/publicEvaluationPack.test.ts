import { describe, it, expect } from "vitest";
import { PublicEvaluationPackSchema } from "./publicEvaluationPack.js";

describe("PublicEvaluationPackSchema", () => {
  it("parses valid pack", () => {
    const valid = {
      version: 1,
      evaluationId: "test",
      name: "test",
      description: "test",
      consumerProjectPath: "test",
      checks: [{
        checkId: "test",
        name: "test",
        command: "test",
        required: true,
        evidence: []
      }],
      scoring: {
        maxScore: 100,
        minimumPassingScore: 90,
        criticalFailureFailsEvaluation: true
      },
      limitations: []
    };
    expect(PublicEvaluationPackSchema.parse(valid)).toBeDefined();
  });
});
