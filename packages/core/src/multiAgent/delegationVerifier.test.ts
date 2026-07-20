import { describe, expect, it } from "vitest";
import { verifyDelegationChainBinding } from "./delegationVerifier.js";
import { type AgentIdentity } from "./agentIdentity.js";

describe("delegationVerifier", () => {
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

  it("delegation chain verifier is deterministic", () => {
    const chain = [planner, executor];
    const binding = {
      originalAgentId: "planner",
      delegatedAgentId: "executor",
      actionHash: "hash123",
      chainLength: 2
    };
    expect(verifyDelegationChainBinding(chain, "hash123", binding)).toBe(true);
  });

  it("approval token mismatch with delegation chain fails closed", () => {
    const chain = [planner, executor];
    const binding = {
      originalAgentId: "planner",
      delegatedAgentId: "other",
      actionHash: "hash123",
      chainLength: 2
    };
    expect(verifyDelegationChainBinding(chain, "hash123", binding)).toBe(false);
  });
});
