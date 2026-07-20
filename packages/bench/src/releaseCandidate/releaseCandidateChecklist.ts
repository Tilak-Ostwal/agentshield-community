import { ReleaseCandidateManifest } from "./releaseCandidateManifest.js";

export const RELEASE_GATES = [
  "build",
  "tests",
  "releaseCheck",
  "benchCi",
  "securityFuzz",
  "redteamCoverage",
  "policyPackAudit",
  "policyBundleVerify",
  "registryBundleVerify",
  "workspaceValidate",
  "recipeDoctor",
  "sensitiveScan",
  "adapterConformance",
  "auditorExport",
  "incidentReport",
  "governance",
  "marketplaceReady",
  "docsSiteReady",
  "corpusV4Ready",
  "perfBaselineReady",
  "supplyChainReady",
  "securityReview",
  "v1ReadinessReady"
] as const;

export function evaluateChecklist(manifest: ReleaseCandidateManifest) {
  const missingGates: string[] = [];
  const req = manifest.requiredGates || {};
  
  for (const gate of RELEASE_GATES) {
    if ((req as any)[gate] !== true) {
      missingGates.push(gate);
    }
  }

  return {
    valid: missingGates.length === 0,
    missingGates
  };
}
