import type { Capability, PolicyDecision, TaintLabel } from "@agentshield/core";

export type AttackGraphEdgeType =
  | "same_resource"
  | "writes_then_executes"
  | "reads_then_exfiltrates"
  | "fingerprint_change_before_sensitive_action"
  | "untrusted_input_to_execution"
  | "secret_to_network"
  | "repeated_denied_attempt";

export type AttackGraphSeverity = "low" | "medium" | "high" | "critical";

export interface AttackGraphNode {
  nodeId: string;
  actionId: string;
  timestamp: string;
  actionType: string;
  toolName?: string;
  operation: string;
  resource?: string;
  inputKeys: string[];
  outputKeys: string[];
  riskHints: string[];
  capabilities: Capability[];
  taintLabels: TaintLabel[];
}

export interface AttackGraphEdge {
  edgeId: string;
  fromNodeId: string;
  toNodeId: string;
  type: AttackGraphEdgeType;
  reason: string;
}

export interface AttackGraphFinding {
  findingId: string;
  patternId: string;
  severity: AttackGraphSeverity;
  title: string;
  explanation: string;
  nodeIds: string[];
  edgeIds: string[];
  recommendedDecision: "deny" | "require_human_review";
  riskMarkers: string[];
}

export interface AttackGraphSnapshot {
  nodes: AttackGraphNode[];
  edges: AttackGraphEdge[];
  findings: AttackGraphFinding[];
}

export interface AttackGraphActionContext {
  policyDecision: PolicyDecision;
  fingerprintChanged: boolean;
  capabilities?: Capability[];
  taintLabels?: TaintLabel[];
}

export interface AttackGraphRiskMarker {
  type: "attack_graph_finding";
  findingId: string;
  patternId: string;
  severity: AttackGraphSeverity;
  recommendedDecision: "deny" | "require_human_review";
}
