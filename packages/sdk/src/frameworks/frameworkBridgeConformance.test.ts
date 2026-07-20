import { describe, expect, it, vi } from "vitest";
import { runFrameworkWorkflow } from "./frameworkWorkflowRunner.js";
import { parseFrameworkToolRegistry } from "./frameworkToolSchema.js";

const conformancePolicy = {
  version: 2,
  name: "conformance-policy",
  rules: [
    { id: "allow-fs-read", effect: "allow", priority: 10, match: { toolName: "filesystem.read" } },
    { id: "allow-doc-read", effect: "allow", priority: 10, match: { toolName: "document.read" } },
    { id: "deny-net-secret", effect: "deny", priority: 100, match: { toolName: "network.post", taintAny: ["secret"] } },
    { id: "allow-net", effect: "allow", priority: 10, match: { toolName: "network.post" } },
    { id: "review-exec", effect: "require_human_review", priority: 10, match: { toolName: "system.exec" }, requireApproval: { reason: "test" } },
    { id: "allow-fs-write", effect: "allow", priority: 10, match: { toolName: "filesystem.write" } }
  ],
  defaultDecision: "deny",
  mode: "strict"
};

describe("frameworkBridgeConformance", () => {
  it("valid tool registry parses", () => {
    expect(() => parseFrameworkToolRegistry([{ version: 1, toolId: "a", name: "a", description: "a" }])).not.toThrow();
  });

  it("invalid tool registry fails closed", () => {
    expect(() => parseFrameworkToolRegistry([{ version: 2 }])).toThrow();
  });

  it("safe readonly workflow can pass if policy allows", () => {
    const execMap = { "filesystem.read": vi.fn(() => ({ ok: true })) };
    const res = runFrameworkWorkflow({
      version: 1, workflowId: "1", name: "safe",
      steps: [{ stepId: "s1", toolName: "filesystem.read" }]
    }, conformancePolicy, execMap);
    expect(res.finalDecision).toBe("allow");
  });

  it("secret exfiltration workflow is denied", () => {
    const pfx = "sk-test-";
    const sfx = "REDACT-ME";
    const execMap = {
      "filesystem.read": vi.fn(() => ({ data: pfx + sfx })),
      "network.post": vi.fn()
    };
    const res = runFrameworkWorkflow({
      version: 1, workflowId: "2", name: "exfil",
      steps: [
        { stepId: "s1", toolName: "filesystem.read" },
        { stepId: "s2", toolName: "network.post" }
      ]
    }, conformancePolicy, execMap);
    expect(res.finalDecision).toBe("deny");
    expect(res.sensitiveDataDetected).toBe(true);
    expect(res.attackGraphPatterns).toContain("secret_to_network");
  });

  it("write-then-execute workflow is denied or reviewed", () => {
    const execMap = {
      "filesystem.write": vi.fn(),
      "system.exec": vi.fn()
    };
    const res = runFrameworkWorkflow({
      version: 1, workflowId: "3", name: "exec",
      steps: [
        { stepId: "s1", toolName: "filesystem.write" },
        { stepId: "s2", toolName: "system.exec" }
      ]
    }, conformancePolicy, execMap);
    expect(["deny", "review"]).toContain(res.finalDecision);
  });

  it("approval-required workflow does not execute without approval", () => {
    const execMap = { "system.exec": vi.fn() };
    const res = runFrameworkWorkflow({
      version: 1, workflowId: "4", name: "approval",
      steps: [{ stepId: "s1", toolName: "system.exec" }]
    }, conformancePolicy, execMap);
    expect(res.finalDecision).toBe("review");
    expect(execMap["system.exec"]).not.toHaveBeenCalled();
  });

  it("per-step evidence is generated and sensitive output is redacted", () => {
    const pfx = "sk-test-";
    const sfx = "REDACT-ME";
    const execMap = { "filesystem.read": vi.fn(() => ({ data: pfx + sfx })) };
    const res = runFrameworkWorkflow({
      version: 1, workflowId: "5", name: "redact",
      steps: [{ stepId: "s1", toolName: "filesystem.read" }]
    }, conformancePolicy, execMap);
    
    expect(res.evidenceRootHash).toMatch(/^sha256:/);
    expect(res.steps[0]?.redactions?.length).toBeGreaterThan(0);
    expect(JSON.stringify(res.steps[0]?.safeOutput)).toContain("[REDACTED:unknown_secret_like]");
  });
});
