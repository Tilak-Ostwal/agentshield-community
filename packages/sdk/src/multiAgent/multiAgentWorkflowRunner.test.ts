import { describe, expect, it } from "vitest";
import { runMultiAgentWorkflow, type MultiAgentWorkflow } from "./multiAgentWorkflowRunner.js";

describe("multiAgentWorkflowRunner", () => {
  const workflow: MultiAgentWorkflow = {
    version: 1, workflowId: "test-flow",
    agents: [{
      version: 1, agentId: "a1", displayName: "A1",
      role: "planner", trustLevel: "untrusted",
      allowedCapabilities: [], deniedCapabilities: []
    }],
    steps: [{
      stepId: "s1", agentId: "a1", toolName: "document.read", input: {}
    }],
    expectedFinalDecision: "allow"
  };

  it("runs basic workflow", () => {
    const res = runMultiAgentWorkflow(workflow);
    expect(res.finalDecision).toBe("allow");
    expect(res.perStepDecisions.length).toBe(1);
    expect(res.perStepDecisions[0]?.decision).toBe("allow");
  });
});
