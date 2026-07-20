import { inferCapabilities, type ActionEnvelope, type PolicyDecision } from "@agentshield/core";

import { actionToGraphNode } from "./actionToGraphNode.js";
import { AttackGraph } from "./attackGraph.js";
import type { AttackGraphActionContext, AttackGraphFinding, AttackGraphRiskMarker } from "./attackGraphTypes.js";
import { inferGraphEdges } from "./inferGraphEdges.js";
import { detectRiskPatterns } from "./riskPatterns.js";

export interface AttackGraphActionResult {
  findings: AttackGraphFinding[];
  riskMarkers: AttackGraphRiskMarker[];
}

function graphRiskMarker(finding: AttackGraphFinding): AttackGraphRiskMarker {
  return {
    type: "attack_graph_finding",
    findingId: finding.findingId,
    patternId: finding.patternId,
    severity: finding.severity,
    recommendedDecision: finding.recommendedDecision
  };
}

function repeatedAttemptKey(action: ActionEnvelope): string {
  const input = typeof action.input === "object" && action.input !== null ? (action.input as Record<string, unknown>) : {};
  const resource = typeof input.path === "string" ? input.path : typeof input.url === "string" ? input.url : "";
  return `${action.toolName ?? action.actionType}:${resource}`;
}

export class AttackGraphEngine {
  public readonly graph = new AttackGraph();
  private readonly deniedAttempts = new Map<string, string[]>();

  public addAction(action: ActionEnvelope, context: AttackGraphActionContext): AttackGraphActionResult {
    const nodeId = `node_${(this.graph.nodes.length + 1).toString().padStart(6, "0")}`;
    const node = actionToGraphNode(action, nodeId, {
      ...context,
      capabilities:
        context.capabilities ??
        inferCapabilities({
          actionType: action.actionType,
          ...(action.toolName === undefined ? {} : { toolName: action.toolName }),
          input: action.input,
          ...(action.metadata === undefined ? {} : { metadata: action.metadata })
        }),
      taintLabels: context.taintLabels ?? []
    });
    const edges = inferGraphEdges(this.graph.nodes, node, `edge_${(this.graph.edges.length + 1).toString().padStart(6, "0")}`);

    this.graph.nodes.push(node);
    this.graph.edges.push(...edges);

    const findings = detectRiskPatterns(
      this.graph.nodes,
      edges,
      this.graph.findings,
      `finding_${(this.graph.findings.length + 1).toString().padStart(6, "0")}`
    );
    const repeatedFinding = this.detectRepeatedDeniedAttempt(action, node.nodeId, context.policyDecision);

    if (repeatedFinding !== undefined) {
      findings.push(repeatedFinding);
    }

    this.graph.findings.push(...findings);

    return {
      findings,
      riskMarkers: findings.map((finding) => graphRiskMarker(finding))
    };
  }

  private detectRepeatedDeniedAttempt(
    action: ActionEnvelope,
    nodeId: string,
    policyDecision: PolicyDecision
  ): AttackGraphFinding | undefined {
    if (policyDecision !== "deny") {
      return undefined;
    }

    const key = repeatedAttemptKey(action);
    const attempts = [...(this.deniedAttempts.get(key) ?? []), nodeId];
    this.deniedAttempts.set(key, attempts);

    if (attempts.length !== 3) {
      return undefined;
    }

    return {
      findingId: `finding_${(this.graph.findings.length + 1).toString().padStart(6, "0")}_repeated_denied`,
      patternId: "repeated-denied-attempt",
      severity: "medium",
      title: "Repeated Denied Attempts",
      explanation: "The same tool/resource was denied at least three times in one session.",
      nodeIds: attempts,
      edgeIds: this.addRepeatedDeniedEdges(attempts),
      recommendedDecision: "require_human_review",
      riskMarkers: ["repeated_denied_attempt"]
    };
  }

  private addRepeatedDeniedEdges(nodeIds: string[]): string[] {
    const edgeIds: string[] = [];

    for (let index = 1; index < nodeIds.length; index += 1) {
      const fromNodeId = nodeIds[index - 1];
      const toNodeId = nodeIds[index];

      if (fromNodeId === undefined || toNodeId === undefined) {
        continue;
      }

      const edgeId = `edge_${(this.graph.edges.length + 1).toString().padStart(6, "0")}_repeated_${index}`;
      this.graph.edges.push({
        edgeId,
        fromNodeId,
        toNodeId,
        type: "repeated_denied_attempt",
        reason: "repeated denied attempt for same tool/resource"
      });
      edgeIds.push(edgeId);
    }

    return edgeIds;
  }

  public snapshot() {
    return this.graph.snapshot();
  }
}
