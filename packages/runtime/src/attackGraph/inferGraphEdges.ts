import type { AttackGraphEdge, AttackGraphNode } from "./attackGraphTypes.js";

function isSensitiveAction(node: AttackGraphNode): boolean {
  return node.capabilities.some((capability) => capability === "shell.exec" || capability === "network.write" || capability === "filesystem.write" || capability === "code_execution");
}

function edge(
  edgeId: string,
  fromNodeId: string,
  toNodeId: string,
  type: AttackGraphEdge["type"],
  reason: string
): AttackGraphEdge {
  return { edgeId, fromNodeId, toNodeId, type, reason };
}

export function inferGraphEdges(
  nodes: AttackGraphNode[],
  currentNode: AttackGraphNode,
  edgeIdPrefix: string
): AttackGraphEdge[] {
  const edges: AttackGraphEdge[] = [];
  let counter = 0;

  for (const priorNode of nodes) {
    const nextEdgeId = () => `${edgeIdPrefix}_${counter++}`;

    if (
      priorNode.resource !== undefined &&
      currentNode.resource !== undefined &&
      priorNode.resource === currentNode.resource
    ) {
      edges.push(edge(nextEdgeId(), priorNode.nodeId, currentNode.nodeId, "same_resource", "actions share resource"));
    }

    if (
      priorNode.capabilities.includes("filesystem.write") &&
      currentNode.capabilities.some((capability) => capability === "shell.exec" || capability === "code_execution") &&
      priorNode.resource !== undefined &&
      priorNode.resource === currentNode.resource
    ) {
      edges.push(
        edge(nextEdgeId(), priorNode.nodeId, currentNode.nodeId, "writes_then_executes", "write followed by exec")
      );
    }

    if (
      priorNode.capabilities.includes("filesystem.read") &&
      priorNode.riskHints.includes("sensitive_path") &&
      currentNode.capabilities.includes("network.write")
    ) {
      edges.push(
        edge(
          nextEdgeId(),
          priorNode.nodeId,
          currentNode.nodeId,
          "reads_then_exfiltrates",
          "sensitive read followed by network post"
        )
      );
    }

    if (
      priorNode.riskHints.includes("fingerprint_changed") &&
      isSensitiveAction(currentNode)
    ) {
      edges.push(
        edge(
          nextEdgeId(),
          priorNode.nodeId,
          currentNode.nodeId,
          "fingerprint_change_before_sensitive_action",
          "fingerprint change before sensitive action"
        )
      );
    }

    if (priorNode.capabilities.includes("untrusted_input_source") && currentNode.capabilities.includes("code_execution")) {
      edges.push(
        edge(
          nextEdgeId(),
          priorNode.nodeId,
          currentNode.nodeId,
          "untrusted_input_to_execution",
          "untrusted input source before code execution"
        )
      );
    }

    if (
      priorNode.riskHints.some((hint) => hint === "secret_key" || hint === "secret_value") &&
      currentNode.capabilities.includes("network.write")
    ) {
      edges.push(
        edge(nextEdgeId(), priorNode.nodeId, currentNode.nodeId, "secret_to_network", "secret hint before network post")
      );
    }
  }

  if (
    currentNode.capabilities.includes("network.write") &&
    currentNode.riskHints.some((hint) => hint === "secret_key" || hint === "secret_value")
  ) {
    edges.push(
      edge(`${edgeIdPrefix}_${counter++}`, currentNode.nodeId, currentNode.nodeId, "secret_to_network", "network post contains secret hint")
    );
  }

  return edges;
}
