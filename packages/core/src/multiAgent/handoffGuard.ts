import { type AgentIdentity } from "./agentIdentity.js";
import { type DelegationPolicy } from "./delegationPolicy.js";

export function evaluateHandoff(
  fromAgent: AgentIdentity | undefined,
  toAgent: AgentIdentity | undefined,
  policy: DelegationPolicy,
  isSensitiveContext: boolean
): "allow" | "deny" | "review" {
  if (!toAgent) {
    return policy.defaults.unknownAgent;
  }
  if (toAgent.trustLevel === "blocked") {
    return "deny";
  }
  
  if (isSensitiveContext) {
    return policy.defaults.sensitiveContextHandoff;
  }

  if (fromAgent) {
    if (fromAgent.trustLevel === "blocked") return "deny";
    
    const rule = policy.rules.find(r => 
      (r.fromRole === fromAgent.role || r.fromRole === "*") &&
      (r.toRole === toAgent.role || r.toRole === "*") &&
      !r.capabilitiesAny
    );
    
    if (rule) return rule.effect;
    
    if (fromAgent.trustLevel !== toAgent.trustLevel) {
      return policy.defaults.crossTrustBoundary;
    }
    
    return policy.defaults.unknownDelegation;
  }

  return "allow";
}
