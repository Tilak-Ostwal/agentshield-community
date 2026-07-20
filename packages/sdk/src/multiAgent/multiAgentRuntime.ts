import { type AgentIdentity, type DelegationPolicy, MultiAgentSessionGraph, evaluateHandoff, detectPrivilegeEscalation, detectTaintLaundering } from "@agentshield/core";

export interface MultiAgentContext {
  graph: MultiAgentSessionGraph;
  policy?: DelegationPolicy;
  activeTaints: string[];
}

export function createMultiAgentContext(policy?: DelegationPolicy): MultiAgentContext {
  const ctx: MultiAgentContext = {
    graph: new MultiAgentSessionGraph(),
    activeTaints: []
  };
  if (policy) ctx.policy = policy;
  return ctx;
}

export function evaluateMultiAgentStep(
  context: MultiAgentContext,
  currentAgent: AgentIdentity,
  targetAgent?: AgentIdentity,
  capabilities: string[] = []
): { valid: boolean; decision?: "allow" | "deny" | "review"; message?: string } {
  // Always register agent if not known
  if (!context.graph.getAgent(currentAgent.agentId)) {
    context.graph.addAgent(currentAgent);
  }
  if (targetAgent && !context.graph.getAgent(targetAgent.agentId)) {
    context.graph.addAgent(targetAgent);
  }
  
  if (targetAgent) {
    context.graph.recordDelegation(currentAgent.agentId, targetAgent.agentId);
  }

  // Check taint laundering
  if (detectTaintLaundering(context.activeTaints, currentAgent, targetAgent)) {
    return { valid: true, decision: "deny", message: "Detected taint laundering attempt" };
  }

  // Check handoff
  if (targetAgent && context.policy) {
    const isSensitive = context.activeTaints.includes("sensitive") || context.activeTaints.includes("secret");
    const handoffDecision = evaluateHandoff(currentAgent, targetAgent, context.policy, isSensitive);
    if (handoffDecision !== "allow") {
      return { valid: true, decision: handoffDecision, message: `Handoff from ${currentAgent.role} to ${targetAgent.role} requires ${handoffDecision}` };
    }
  }

  // Check privilege escalation
  const targetId = targetAgent ? targetAgent.agentId : currentAgent.agentId;
  const chain = context.graph.getDelegationChain(targetId);
  const esc = detectPrivilegeEscalation(chain, capabilities, context.policy);
  if (esc.escalating) {
    return { valid: true, decision: "deny", ...(esc.message ? { message: esc.message } : {}) };
  }

  return { valid: true, decision: "allow" };
}
