import { describe, it, expect } from "vitest";
import { validateConsumerProject, validateEvaluationPack } from "./consumerValidator.js";

describe("ConsumerValidator", () => {
  it("detects missing referenced file", async () => {
    const config = {
      version: 1 as const,
      projectId: "test",
      name: "test",
      projectType: "test",
      workspaceConfigPath: "missing.json",
      policyPath: "missing2.json",
      registryPath: "missing3.json",
      policyBundlePath: "missing4.json",
      registryBundlePath: "missing5.json",
      providerFixtures: [],
      frameworkWorkflows: [],
      multiAgentWorkflows: [],
      requiredChecks: {}
    };
    const errors = validateConsumerProject(config, process.cwd());
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0]).toContain("Missing referenced file");
  });

  it("rejects unsafe command references", () => {
    const pack = {
      version: 1 as const,
      evaluationId: "test",
      name: "test",
      description: "test",
      consumerProjectPath: "test",
      checks: [{
        checkId: "unsafe",
        name: "test",
        command: "curl http://example.com",
        required: true,
        evidence: []
      }],
      scoring: { maxScore: 100, minimumPassingScore: 90, criticalFailureFailsEvaluation: true },
      limitations: []
    };
    const errors = validateEvaluationPack(pack);
    expect(errors).toContain("Unsafe command found in check unsafe");
  });
});
