import { describe, expect, it, vi } from "vitest";
import { runFrameworkWorkflow } from "./frameworkWorkflowRunner.js";

const mockPolicy = {
  version: 2,
  name: "test",
  rules: [
    { id: "allow-fs", effect: "allow", priority: 10, match: { toolName: "filesystem.read" } },
    { id: "deny-net-secret", effect: "deny", priority: 10, match: { toolName: "network.post", taintAny: ["secret"] } },
    { id: "allow-net", effect: "allow", priority: 1, match: { toolName: "network.post" } },
    { id: "review-exec", effect: "require_human_review", priority: 10, match: { toolName: "system.exec" }, requireApproval: { reason: "review" } }
  ],
  defaultDecision: "deny",
  mode: "strict"
};

describe("frameworkWorkflowRunner", () => {
  it("safe readonly workflow runs with safe mock executor", () => {
    const execMap = {
      "filesystem.read": vi.fn(() => ({ data: "safe content" }))
    };
    
    const result = runFrameworkWorkflow({
      version: 1,
      workflowId: "w1",
      name: "safe",
      steps: [{ stepId: "s1", toolName: "filesystem.read" }]
    }, mockPolicy, execMap);
    
    expect(result.finalDecision).toBe("allow");
    expect(result.steps[0]?.executed).toBe(true);
    expect(execMap["filesystem.read"]).toHaveBeenCalled();
  });

  it("secret exfiltration workflow is denied", () => {
    const pfx = "sk-test-";
    const sfx = "REDACT-ME";
    const execMap = {
      "filesystem.read": vi.fn(() => ({ data: pfx + sfx })),
      "network.post": vi.fn(() => ({ success: true }))
    };
    
    const result = runFrameworkWorkflow({
      version: 1,
      workflowId: "w2",
      name: "exfil",
      steps: [
        { stepId: "s1", toolName: "filesystem.read" },
        { stepId: "s2", toolName: "network.post" }
      ]
    }, mockPolicy, execMap);
    
    expect(result.steps[0]?.executed).toBe(true); // reads the file
    expect(result.steps[1]?.executed).toBe(false); // denied sending to network
    expect(result.steps[1]?.decision).toBe("deny");
    expect(result.finalDecision).toBe("deny");
    expect(result.sensitiveDataDetected).toBe(true);
    expect(result.attackGraphPatterns).toContain("secret_to_network");
  });

  it("denied step stops or blocks later unsafe execution", () => {
    const execMap = {
      "unknown.tool": vi.fn(),
      "filesystem.read": vi.fn()
    };
    
    const result = runFrameworkWorkflow({
      version: 1,
      workflowId: "w3",
      name: "block",
      steps: [
        { stepId: "s1", toolName: "unknown.tool" }, // will be denied by default
        { stepId: "s2", toolName: "filesystem.read" } // should not run
      ]
    }, mockPolicy, execMap);
    
    expect(result.steps[0]?.decision).toBe("deny");
    expect(result.steps[1]?.executed).toBe(false);
    expect(result.steps[1]?.reason).toContain("Blocked by previous step");
    expect(result.finalDecision).toBe("deny");
    expect(execMap["unknown.tool"]).not.toHaveBeenCalled();
    expect(execMap["filesystem.read"]).not.toHaveBeenCalled();
  });
});
