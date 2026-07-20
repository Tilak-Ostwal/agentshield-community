import { describe, expect, it } from "vitest";
import { detectTaintLaundering } from "./crossAgentTaint.js";
import { type AgentIdentity } from "./agentIdentity.js";

describe("crossAgentTaint", () => {
  const untrusted: AgentIdentity = {
    version: 1, agentId: "untrusted", displayName: "Untrusted",
    role: "planner", trustLevel: "untrusted",
    allowedCapabilities: [], deniedCapabilities: []
  };

  const trusted: AgentIdentity = {
    version: 1, agentId: "trusted", displayName: "Trusted",
    role: "executor", trustLevel: "trusted",
    allowedCapabilities: [], deniedCapabilities: []
  };

  it("taint laundering attempt is detected", () => {
    expect(detectTaintLaundering(["sensitive"], untrusted, trusted)).toBe(true);
    expect(detectTaintLaundering(["secret"], untrusted, trusted)).toBe(true);
  });

  it("normal handoff is not laundering", () => {
    expect(detectTaintLaundering(["network"], untrusted, trusted)).toBe(false);
  });
});
