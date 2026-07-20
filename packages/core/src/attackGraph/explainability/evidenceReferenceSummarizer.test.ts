import { describe, expect, it } from "vitest";
import { summarizeEvidenceReferences } from "./evidenceReferenceSummarizer.js";

describe("evidenceReferenceSummarizer", () => {
  it("evidence explanation works", () => {
    const graph = { nodes: [{ id: "n1", toolName: "t", actionType: "a", decision: "d" }], edges: [] };
    const summary = summarizeEvidenceReferences(graph);
    expect(summary.referencedEvents).toContain("n1");
  });
});
