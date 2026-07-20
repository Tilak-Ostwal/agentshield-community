import type { AttackGraphEdge, AttackGraphFinding, AttackGraphNode, AttackGraphSnapshot } from "./attackGraphTypes.js";

export class AttackGraph {
  public readonly nodes: AttackGraphNode[] = [];
  public readonly edges: AttackGraphEdge[] = [];
  public readonly findings: AttackGraphFinding[] = [];

  public snapshot(): AttackGraphSnapshot {
    return {
      nodes: this.nodes.map((node) => ({ ...node, inputKeys: [...node.inputKeys], outputKeys: [...node.outputKeys], riskHints: [...node.riskHints], capabilities: [...node.capabilities], taintLabels: [...node.taintLabels] })),
      edges: this.edges.map((edge) => ({ ...edge })),
      findings: this.findings.map((finding) => ({
        ...finding,
        nodeIds: [...finding.nodeIds],
        edgeIds: [...finding.edgeIds],
        riskMarkers: [...finding.riskMarkers]
      }))
    };
  }
}
