import { RawAttackGraph } from "./explainAttackGraph.js";

export function reconstructDecisionChain(graph: RawAttackGraph) {
  const chain = [];
  for (const node of graph.nodes) {
    const edgeToNode = graph.edges.find(e => e.to === node.id);
    chain.push({
      nodeId: node.id,
      toolName: node.toolName,
      decision: node.decision,
      dataType: edgeToNode ? edgeToNode.dataType : undefined
    });
  }
  return chain;
}
