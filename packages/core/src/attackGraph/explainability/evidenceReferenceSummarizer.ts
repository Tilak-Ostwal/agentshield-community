import { RawAttackGraph } from "./explainAttackGraph.js";

export function summarizeEvidenceReferences(graph: RawAttackGraph) {
  return {
    evidenceRootHash: graph.metadata?.evidenceHash || "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    referencedEvents: graph.nodes.map(n => n.id)
  };
}
