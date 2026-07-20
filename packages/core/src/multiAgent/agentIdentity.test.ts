import { describe, expect, it } from "vitest";
import { parseAgentIdentity } from "./agentIdentity.js";

describe("agentIdentity", () => {
  it("parses valid agent identity", () => {
    const valid = {
      version: 1,
      agentId: "planner-agent",
      displayName: "Planner Agent",
      role: "planner",
      trustLevel: "untrusted",
      allowedCapabilities: ["filesystem.read"],
      deniedCapabilities: ["network.write"],
      metadata: { source: "local-fixture" }
    };
    const res = parseAgentIdentity(valid);
    expect(res.valid).toBe(true);
    expect(res.identity?.agentId).toBe("planner-agent");
  });

  it("rejects invalid agent identity", () => {
    const res = parseAgentIdentity({ version: 2 });
    expect(res.valid).toBe(false);
    expect(res.error).toBeDefined();
  });
});
