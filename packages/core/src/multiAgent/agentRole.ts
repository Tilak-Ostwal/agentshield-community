import { z } from "zod";

export const AgentRoleSchema = z.enum(["planner", "executor", "reviewer", "approver", "auditor", "worker", "unknown"]);
export type AgentRole = z.infer<typeof AgentRoleSchema>;

export const AgentTrustLevelSchema = z.enum(["trusted", "reviewed", "untrusted", "blocked"]);
export type AgentTrustLevel = z.infer<typeof AgentTrustLevelSchema>;

export function isHighRiskRole(role: AgentRole): boolean {
  return role === "executor" || role === "worker";
}
