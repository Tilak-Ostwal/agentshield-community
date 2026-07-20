import { z } from "zod";

export const trustLevelSchema = z.enum(["trusted", "reviewed", "unknown", "blocked"]);
export type TrustLevel = z.infer<typeof trustLevelSchema>;

export function trustDecisionImpact(trustLevel: TrustLevel): "none" | "require_human_review" | "deny" {
  if (trustLevel === "blocked") return "deny";
  if (trustLevel === "unknown") return "require_human_review";
  return "none";
}
