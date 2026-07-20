import { describe, expect, it } from "vitest";
import { evaluatePolicy } from "../policyEvaluator.js";

function action(toolName = "filesystem.read", path = "/mock/project/file.txt") {
  return {
    actionId: "a",
    timestamp: "2026-06-26T00:00:00.000Z",
    actionType: "tool_call",
    toolName,
    input: { path }
  };
}

function policy(rules: unknown[]) {
  return { version: 2, name: "test", defaultDecision: "deny", mode: "strict", rules };
}

describe("policyV2Evaluator", () => {
  it("explicit deny beats allow", () => {
    const result = evaluatePolicy(policy([
      { id: "allow", effect: "allow", priority: 1000, match: { actionType: "tool_call" } },
      { id: "deny", effect: "deny", priority: 1, match: { actionType: "tool_call" } }
    ]), action());

    expect(result).toMatchObject({ decision: "deny", ruleId: "deny" });
  });

  it("higher priority allow cannot beat explicit deny", () => {
    const result = evaluatePolicy(policy([
      { id: "allow-high", effect: "allow", priority: 9999, match: { capability: "filesystem.read" } },
      { id: "deny-low", effect: "deny", priority: -1, match: { capability: "filesystem.read" } }
    ]), action(), { capabilities: ["filesystem.read"] });

    expect(result).toMatchObject({ decision: "deny", ruleId: "deny-low" });
  });

  it("require_human_review beats allow", () => {
    const result = evaluatePolicy(policy([
      { id: "allow", effect: "allow", priority: 100, match: { capability: "filesystem.write" } },
      { id: "review", effect: "require_human_review", priority: 1, match: { capability: "filesystem.write" }, requireApproval: { reason: "review" } }
    ]), action("filesystem.write"), { capabilities: ["filesystem.write"] });

    expect(result).toMatchObject({ decision: "require_human_review", ruleId: "review" });
  });

  it("resource deny overrides resource allow", () => {
    const result = evaluatePolicy(policy([
      { id: "allow-project", effect: "allow", priority: 1, match: { capability: "filesystem.read", resource: { type: "filesystem", allow: ["/mock/project/**"], deny: ["/mock/project/secrets/**"] } } }
    ]), action("filesystem.read", "/mock/project/secrets/key.txt"), { capabilities: ["filesystem.read"] });

    expect(result).toMatchObject({ decision: "deny", ruleId: "default-deny" });
  });

  it("exact toolName wins over toolNamePattern at equal priority", () => {
    const result = evaluatePolicy(policy([
      { id: "pattern", effect: "allow", priority: 10, match: { toolNamePattern: "filesystem.*" } },
      { id: "exact", effect: "allow", priority: 10, match: { toolName: "filesystem.read" } }
    ]), action());

    expect(result).toMatchObject({ decision: "allow", ruleId: "exact" });
  });

  it("capability matching works", () => {
    expect(evaluatePolicy(policy([
      { id: "cap", effect: "allow", priority: 1, match: { capability: "filesystem.read" } }
    ]), action(), { capabilities: ["filesystem.read"] }).decision).toBe("allow");
  });

  it("capabilitiesAny matching works", () => {
    expect(evaluatePolicy(policy([
      { id: "any", effect: "allow", priority: 1, match: { capabilitiesAny: ["filesystem.write", "filesystem.read"] } }
    ]), action(), { capabilities: ["filesystem.read"] }).decision).toBe("allow");
  });

  it("capabilitiesAll matching works", () => {
    expect(evaluatePolicy(policy([
      { id: "all", effect: "allow", priority: 1, match: { capabilitiesAll: ["filesystem.read", "network.write"] } }
    ]), action(), { capabilities: ["filesystem.read", "network.write"] }).decision).toBe("allow");
  });

  it("taintAny matching works", () => {
    expect(evaluatePolicy(policy([
      { id: "taint-any", effect: "deny", priority: 1, match: { taintAny: ["secret", "credential"] } }
    ]), action(), { taintLabels: ["secret"] }).ruleId).toBe("taint-any");
  });

  it("taintAll matching works", () => {
    expect(evaluatePolicy(policy([
      { id: "taint-all", effect: "deny", priority: 1, match: { taintAll: ["secret", "token"] } }
    ]), action(), { taintLabels: ["secret", "token"] }).ruleId).toBe("taint-all");
  });

  it("attackGraphPatternAny matching works", () => {
    expect(evaluatePolicy(policy([
      { id: "graph", effect: "deny", priority: 1, match: { attackGraphPatternAny: ["secret_to_network"] } }
    ]), action(), { attackGraphPatterns: ["secret_to_network"] }).ruleId).toBe("graph");
  });

  it("v2 policy allows safe filesystem.read under allowed scope", () => {
    expect(evaluatePolicy(policy([
      { id: "allow-project", effect: "allow", priority: 1, match: { capability: "filesystem.read", resource: { type: "filesystem", allow: ["/mock/project/**"] } } }
    ]), action(), { capabilities: ["filesystem.read"] }).decision).toBe("allow");
  });

  it("v2 policy denies filesystem.read outside allowed scope", () => {
    expect(evaluatePolicy(policy([
      { id: "allow-project", effect: "allow", priority: 1, match: { capability: "filesystem.read", resource: { type: "filesystem", allow: ["/mock/project/**"] } } }
    ]), action("filesystem.read", "/etc/passwd"), { capabilities: ["filesystem.read"] }).decision).toBe("deny");
  });

  it("v2 policy denies network.write with secret taint", () => {
    expect(evaluatePolicy(policy([
      { id: "deny-secret-network", effect: "deny", priority: 1, match: { capabilitiesAny: ["network.write"], taintAny: ["secret"] } }
    ]), action("network.post"), { capabilities: ["network.write"], taintLabels: ["secret"] }).ruleId).toBe("deny-secret-network");
  });

  it("v2 policy requires review for filesystem.write", () => {
    expect(evaluatePolicy(policy([
      { id: "review-write", effect: "require_human_review", priority: 1, match: { capability: "filesystem.write" }, requireApproval: { reason: "review" } }
    ]), action("filesystem.write"), { capabilities: ["filesystem.write"] }).decision).toBe("require_human_review");
  });
});
