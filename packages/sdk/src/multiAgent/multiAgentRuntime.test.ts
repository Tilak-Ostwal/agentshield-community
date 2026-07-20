import { describe, expect, it } from "vitest";
import { createMultiAgentContext, evaluateMultiAgentStep } from "./multiAgentRuntime.js";
import { type AgentIdentity } from "@agentshield/core";

describe("multiAgentRuntime", () => {
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

  it("allows safe step", () => {
    const ctx = createMultiAgentContext();
    const res = evaluateMultiAgentStep(ctx, planner, undefined, ["document.read"]);
    expect(res.decision).toBe("allow");
  });

  it("blocks privilege escalation", () => {
    const ctx = createMultiAgentContext();
    const res = evaluateMultiAgentStep(ctx, planner, executor, ["process.exec"]);
    expect(res.decision).toBe("deny");
    expect(res.message).toContain("Planner-originated");
  });
  
  it("blocks taint laundering", () => {
    const ctx = createMultiAgentContext();
    ctx.activeTaints.push("sensitive");
    const res = evaluateMultiAgentStep(ctx, planner, executor, ["network.write"]);
    expect(res.decision).toBe("deny");
    expect(res.message).toContain("taint laundering");
  });
});
