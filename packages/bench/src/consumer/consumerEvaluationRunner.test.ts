import { describe, it, expect } from "vitest";
import { runConsumerEvaluation } from "./consumerEvaluationRunner.js";

describe("ConsumerEvaluationRunner", () => {
  it("consumer evaluation score is deterministic", async () => {
    const config = {
      version: 1 as const,
      projectId: "test",
      name: "test",
      projectType: "test",
      workspaceConfigPath: "test.json",
      policyPath: "test.json",
      registryPath: "test.json",
      policyBundlePath: "test.json",
      registryBundlePath: "test.json",
      providerFixtures: [],
      frameworkWorkflows: [],
      multiAgentWorkflows: [],
      requiredChecks: {}
    };
    const result1 = runConsumerEvaluation(config, process.cwd());
    const result2 = runConsumerEvaluation(config, process.cwd());
    expect(result1.score).toBe(result2.score);
  });

  it("consumer evaluation fails on critical missing bundle", async () => {
    const config = {
      version: 1 as const,
      projectId: "test",
      name: "test",
      projectType: "test",
      workspaceConfigPath: "test.json",
      policyPath: "test.json",
      registryPath: "test.json",
      policyBundlePath: "missing_bundle.json",
      registryBundlePath: "test.json",
      providerFixtures: [],
      frameworkWorkflows: [],
      multiAgentWorkflows: [],
      requiredChecks: {}
    };
    
    const result = await runConsumerEvaluation(config, process.cwd());
    expect(result.score).toBe(0);
    expect(result.failedChecks).toContain("consumer-policy-bundle-verify");
  });
  
  it("consumer evaluation includes workspace readiness", async () => {
      const config = {
      version: 1 as const,
      projectId: "test",
      name: "test",
      projectType: "test",
      workspaceConfigPath: "test.json",
      policyPath: "test.json",
      registryPath: "test.json",
      policyBundlePath: "missing_bundle.json",
      registryBundlePath: "test.json",
      providerFixtures: [],
      frameworkWorkflows: [],
      multiAgentWorkflows: [],
      requiredChecks: {}
    };
    
    const result = await runConsumerEvaluation(config, process.cwd());
    expect(result.passedChecks).toContain("workspace readiness");
  });
});
