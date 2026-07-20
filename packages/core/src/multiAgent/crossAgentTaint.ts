import { type AgentIdentity } from "./agentIdentity.js";

export function detectTaintLaundering(
  sourceTaints: string[],
  fromAgent?: AgentIdentity,
  toAgent?: AgentIdentity
): boolean {
  if (!fromAgent || !toAgent) return false;
  
  const hasSensitiveTaint = sourceTaints.includes("sensitive") || sourceTaints.includes("secret");
  
  if (hasSensitiveTaint) {
    if (fromAgent.trustLevel === "untrusted" && toAgent.trustLevel === "trusted") {
      return true;
    }
    if (fromAgent.role === "planner" && toAgent.role === "executor") {
      return true;
    }
  }
  
  return false;
}
