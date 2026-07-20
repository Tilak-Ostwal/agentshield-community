import { describe, it, expect } from "vitest";
import { ConsumerProjectSchema } from "./consumerProjectSchema.js";

describe("ConsumerProjectSchema", () => {
  it("parses valid config", () => {
    const valid = {
      version: 1,
      projectId: "test",
      name: "test",
      projectType: "agent-app",
      workspaceConfigPath: "test",
      policyPath: "test",
      registryPath: "test",
      policyBundlePath: "test",
      registryBundlePath: "test",
      providerFixtures: [],
      frameworkWorkflows: [],
      multiAgentWorkflows: [],
      requiredChecks: {}
    };
    expect(ConsumerProjectSchema.parse(valid)).toBeDefined();
  });

  it("rejects invalid config", () => {
    expect(() => ConsumerProjectSchema.parse({ version: 2 })).toThrow();
  });
});
