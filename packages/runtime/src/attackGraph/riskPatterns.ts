import type { AttackGraphEdge, AttackGraphFinding, AttackGraphNode } from "./attackGraphTypes.js";



function hasExistingFinding(findings: AttackGraphFinding[], patternId: string, nodeIds: string[]): boolean {
  const key = nodeIds.join("|");
  return findings.some((candidate) => candidate.patternId === patternId && candidate.nodeIds.join("|") === key);
}

export function detectRiskPatterns(
  nodes: AttackGraphNode[],
  edges: AttackGraphEdge[],
  existingFindings: AttackGraphFinding[],
  findingIdPrefix: string
): AttackGraphFinding[] {
  const findings: AttackGraphFinding[] = [];
  let counter = 0;
  const add = (candidate: Omit<AttackGraphFinding, "findingId">) => {
    if (hasExistingFinding(existingFindings, candidate.patternId, candidate.nodeIds)) {
      return;
    }

    findings.push({ findingId: `${findingIdPrefix}_${counter++}`, ...candidate });
  };

  for (const edge of edges) {
    if (edge.type === "writes_then_executes") {
      add({
        patternId: "write-then-exec",
        severity: "high",
        title: "Filesystem Write Followed By Shell Exec",
        explanation: "A file write was followed by shell execution on the same resource.",
        nodeIds: [edge.fromNodeId, edge.toNodeId],
        edgeIds: [edge.edgeId],
        recommendedDecision: "require_human_review",
        riskMarkers: ["write_then_exec_same_path"]
      });
    }

    if (edge.type === "reads_then_exfiltrates") {
      add({
        patternId: "sensitive-read-then-network",
        severity: "critical",
        title: "Sensitive Read Followed By Network Post",
        explanation: "A sensitive-looking local resource was read before a network post.",
        nodeIds: [edge.fromNodeId, edge.toNodeId],
        edgeIds: [edge.edgeId],
        recommendedDecision: "deny",
        riskMarkers: ["sensitive_read_then_network"]
      });
    }

    if (edge.type === "secret_to_network") {
      add({
        patternId: "secret-to-network",
        severity: "critical",
        title: "Secret Material Sent Toward Network",
        explanation: "Secret-looking input was associated with a network post.",
        nodeIds: edge.fromNodeId === edge.toNodeId ? [edge.toNodeId] : [edge.fromNodeId, edge.toNodeId],
        edgeIds: [edge.edgeId],
        recommendedDecision: "deny",
        riskMarkers: ["secret_to_network"]
      });
    }

    if (edge.type === "fingerprint_change_before_sensitive_action") {
      add({
        patternId: "fingerprint-change-before-sensitive-action",
        severity: "high",
        title: "Fingerprint Change Before Sensitive Action",
        explanation: "A changed tool fingerprint appeared before a sensitive action.",
        nodeIds: [edge.fromNodeId, edge.toNodeId],
        edgeIds: [edge.edgeId],
        recommendedDecision: "require_human_review",
        riskMarkers: ["fingerprint_change_before_sensitive_action"]
      });
    }

    if (edge.type === "untrusted_input_to_execution") {
      add({
        patternId: "untrusted-input-to-execution",
        severity: "high",
        title: "Untrusted Input To Execution",
        explanation: "An untrusted input source appeared before code execution.",
        nodeIds: [edge.fromNodeId, edge.toNodeId],
        edgeIds: [edge.edgeId],
        recommendedDecision: "require_human_review",
        riskMarkers: ["untrusted_input_to_execution"]
      });
    }
  }

  for (const node of nodes) {
    if (
      node.capabilities.includes("network.write") &&
      node.taintLabels.some((label) => label === "secret" || label === "env_secret" || label === "credential" || label === "token" || label === "api_key")
    ) {
      add({
        patternId: "taint-secret-to-network",
        severity: "critical",
        title: "Tainted Secret To Network",
        explanation: "Secret or credential taint reached a network write capability.",
        nodeIds: [node.nodeId],
        edgeIds: [],
        recommendedDecision: "deny",
        riskMarkers: ["taint_secret_to_network"]
      });
    }

    if (
      node.capabilities.some((capability) => capability === "shell.exec" || capability === "code_execution") &&
      node.taintLabels.some((label) => label === "browser_untrusted" || label === "generated_code" || label === "executable_content")
    ) {
      add({
        patternId: "taint-untrusted-to-execution",
        severity: "high",
        title: "Tainted Content To Execution",
        explanation: "Untrusted or generated taint reached an execution capability.",
        nodeIds: [node.nodeId],
        edgeIds: [],
        recommendedDecision: "require_human_review",
        riskMarkers: ["taint_untrusted_to_execution"]
      });
    }

    if (node.riskHints.includes("llm_allow_policy_deny")) {
      add({
        patternId: "llm-advisory-allow-conflict",
        severity: "medium",
        title: "LLM Advisory Conflicts With Deterministic Deny",
        explanation: "The LLM advisory requested allow while deterministic policy denied the action.",
        nodeIds: [node.nodeId],
        edgeIds: [],
        recommendedDecision: "deny",
        riskMarkers: ["llm_advisory_allow_conflict"]
      });
    }
  }

  return findings;
}
