import { describe, expect, it } from "vitest";
import { generateMultiAgentReport, type MultiAgentWorkflowResult } from "./multiAgentReport.js";

interface MultiAgentJsonReport {
  finalDecision: string;
}

describe("multiAgentReport", () => {
  const mockResult: MultiAgentWorkflowResult = {
    workflowId: "test", finalDecision: "deny", agents: [],
    delegationChains: [], perStepDecisions: [{ stepId: "s1", decision: "deny", message: "blocked" }],
    taintPropagation: [], sensitiveData: { involved: false, types: [] }, findings: [], evidenceRootHash: "abc"
  };

  it("generates text report", () => {
    const txt = generateMultiAgentReport(mockResult, "text");
    expect(txt).toContain("Final Decision: DENY");
  });

  it("generates json report", () => {
    const json = generateMultiAgentReport(mockResult, "json");
    expect((JSON.parse(json) as MultiAgentJsonReport).finalDecision).toBe("deny");
  });
});
