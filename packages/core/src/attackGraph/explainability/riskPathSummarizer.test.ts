import { describe, expect, it } from "vitest";
import { summarizeRiskPath } from "./riskPathSummarizer.js";

describe("riskPathSummarizer", () => {
  it("risk path order is stable", () => {
    const graph = {
      nodes: [{ id: "1", toolName: "fs.read", actionType: "call", decision: "allow" }],
      edges: []
    };
    const path = summarizeRiskPath(graph, [{ nodeId: "1", toolName: "fs.read", decision: "allow" }]);
    expect(path[0]!.role).toBe("sensitive_read");
    expect(path[0]!.step).toBe(1);
  });
});
