import { type AgentIdentity } from "./agentIdentity.js";
import { type DelegationPolicy } from "./delegationPolicy.js";

export interface PrivilegeEscalationResult {
  escalating: boolean;
  message?: string;
}

export function detectPrivilegeEscalation(
  chain: AgentIdentity[],
  capabilities: string[],
  policy?: DelegationPolicy
): PrivilegeEscalationResult {
  if (chain.length < 2) return { escalating: false };
  
  const source = chain[0];
  const executor = chain[chain.length - 1];
  
  const highRisk = capabilities.some(c => c.includes("process.exec") || c.includes("network.write"));
  if (highRisk && source && (source.role === "planner" || source.trustLevel === "untrusted")) {
    if (policy) {
      const allowed = policy.rules.find(r => 
        (r.fromRole === source.role || r.fromRole === "*") &&
        (r.toRole === executor?.role || r.toRole === "*") &&
        r.effect === "allow" &&
        (!r.capabilitiesAny || r.capabilitiesAny.some(c => capabilities.includes(c)))
      );
      if (allowed) return { escalating: false };
    }
    
    return {
      escalating: true,
      message: `${source.role === "planner" ? "Planner" : "Untrusted"}-originated context attempted to delegate shell execution to ${executor?.role || "executor"}.`
    };
  }
  
  return { escalating: false };
}
