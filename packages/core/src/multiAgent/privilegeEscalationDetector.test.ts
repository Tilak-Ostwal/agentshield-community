import { describe, expect, it } from "vitest";
import { detectPrivilegeEscalation } from "./privilegeEscalationDetector.js";
import { type AgentIdentity } from "./agentIdentity.js";

describe("privilegeEscalationDetector", () => {
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

  it("privilege escalation detector is deterministic", () => {
    const res = detectPrivilegeEscalation([planner, executor], ["process.exec"]);
    expect(res.escalating).toBe(true);
    expect(res.message).toBe("Planner-originated context attempted to delegate shell execution to executor.");
  });

  it("planner cannot escalate to shell execution through executor", () => {
    const res = detectPrivilegeEscalation([planner, executor], ["process.exec"]);
    expect(res.escalating).toBe(true);
  });
});
