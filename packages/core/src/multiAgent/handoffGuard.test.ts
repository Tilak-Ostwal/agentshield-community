import { describe, expect, it } from "vitest";
import { evaluateHandoff } from "./handoffGuard.js";
import { type AgentIdentity } from "./agentIdentity.js";
import { type DelegationPolicy } from "./delegationPolicy.js";

describe("handoffGuard", () => {
  const policy: DelegationPolicy = {
    version: 1, policyId: "test",
    rules: [],
    defaults: {
      unknownAgent: "deny", unknownDelegation: "deny",
      crossTrustBoundary: "review", sensitiveContextHandoff: "review"
    }
  };

  const planner: AgentIdentity = {
    version: 1, agentId: "planner", displayName: "Planner",
    role: "planner", trustLevel: "untrusted",
    allowedCapabilities: [], deniedCapabilities: []
  };

  const executor: AgentIdentity = {
    version: 1, agentId: "executor", displayName: "Executor",
    role: "executor", trustLevel: "trusted",
    allowedCapabilities: [], deniedCapabilities: []
  };
  
  const blocked: AgentIdentity = {
    version: 1, agentId: "blocked", displayName: "Blocked",
    role: "worker", trustLevel: "blocked",
    allowedCapabilities: [], deniedCapabilities: []
  };

  it("unknown agent fails closed", () => {
    expect(evaluateHandoff(planner, undefined, policy, false)).toBe("deny");
  });

  it("unknown delegation path fails closed", () => {
    // If not cross trust boundary but unknown, should hit unknownDelegation
    const p2: AgentIdentity = { ...planner, agentId: "p2" };
    expect(evaluateHandoff(planner, p2, policy, false)).toBe("deny");
  });

  it("blocked agent cannot execute", () => {
    expect(evaluateHandoff(undefined, blocked, policy, false)).toBe("deny");
  });

  it("sensitive context handoff triggers review or deny", () => {
    expect(evaluateHandoff(planner, executor, policy, true)).toBe("review");
  });
});
