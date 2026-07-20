import { describe, expect, it } from "vitest";
import { reconstructDecisionChain } from "./decisionChain.js";

describe("decisionChain", () => {
  it("decision chain reconstruction is deterministic", () => {
    const graph = {
      nodes: [{ id: "1", toolName: "a", actionType: "call", decision: "allow" }],
      edges: []
    };
    const chain = reconstructDecisionChain(graph);
    expect(chain[0]!.nodeId).toBe("1");
  });
});
