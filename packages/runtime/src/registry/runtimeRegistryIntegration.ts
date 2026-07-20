import type { PolicyEvaluation } from "@agentshield/core";
import type { FingerprintAttestationResult, RegistryFinding } from "@agentshield/registry";

export interface RegistryRiskMarker {
  type: "registry_attestation_finding";
  findingType: string;
  severity: RegistryFinding["severity"];
}

export function strengthenWithRegistryAttestation(
  evaluation: PolicyEvaluation,
  attestation: FingerprintAttestationResult | undefined
): PolicyEvaluation {
  if (evaluation.decision === "deny" || attestation === undefined || attestation.decisionImpact === "none") {
    return evaluation;
  }

  if (attestation.decisionImpact === "deny") {
    return {
      decision: "deny",
      ruleId: "registry-attestation-deny",
      reason: "local tool registry attestation denied tool"
    };
  }

  return {
    decision: "require_human_review",
    ruleId: "registry-attestation-review",
    reason: "local tool registry attestation requires review"
  };
}

export function registryRiskMarkers(attestation: FingerprintAttestationResult | undefined): RegistryRiskMarker[] {
  return (
    attestation?.findings.map((finding) => ({
      type: "registry_attestation_finding" as const,
      findingType: finding.type,
      severity: finding.severity
    })) ?? []
  );
}
