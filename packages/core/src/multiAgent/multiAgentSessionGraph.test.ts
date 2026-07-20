import { describe, expect, it } from "vitest";
import { MultiAgentSessionGraph } from "./multiAgentSessionGraph.js";
import { type AgentIdentity } from "./agentIdentity.js";

describe("multiAgentSessionGraph", () => {
  it("multi-agent session graph is deterministic", () => {
    const graph = new MultiAgentSessionGraph();
    
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

    graph.addAgent(planner);
    graph.addAgent(executor);
    
    graph.recordDelegation("planner", "executor");
    
    const chain = graph.getDelegationChain("executor");
    expect(chain.length).toBe(2);
    expect(chain[0]?.agentId).toBe("planner");
    expect(chain[1]?.agentId).toBe("executor");
  });
});
