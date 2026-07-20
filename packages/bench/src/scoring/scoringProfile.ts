export type ScoringProfileName = "strict" | "balanced" | "audit" | "dev";

export interface ScoringProfile {
  name: ScoringProfileName;
  failOnCriticalFailure: boolean;
  requireEvidenceForAudit: boolean;
}

export const scoringProfiles: Record<ScoringProfileName, ScoringProfile> = {
  strict: { name: "strict", failOnCriticalFailure: true, requireEvidenceForAudit: false },
  balanced: { name: "balanced", failOnCriticalFailure: false, requireEvidenceForAudit: false },
  audit: { name: "audit", failOnCriticalFailure: true, requireEvidenceForAudit: true },
  dev: { name: "dev", failOnCriticalFailure: false, requireEvidenceForAudit: false }
};

export function getScoringProfile(name: ScoringProfileName = "balanced"): ScoringProfile {
  return scoringProfiles[name];
}

export function parseScoringProfile(value: string | undefined): ScoringProfileName {
  if (value === undefined) return "balanced";
  if (value === "strict" || value === "balanced" || value === "audit" || value === "dev") return value;
  throw new Error("bench --profile must be strict, balanced, audit, or dev");
}
