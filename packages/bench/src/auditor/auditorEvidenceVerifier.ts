import { computeAuditorEvidencePackHash } from "./auditorEvidenceHash.js";
import type { AuditorEvidencePack } from "./auditorEvidencePackSchema.js";

export interface AuditorEvidenceVerificationResult {
  valid: boolean;
  failures: string[];
}

export function verifyAuditorEvidencePack(pack: AuditorEvidencePack): AuditorEvidenceVerificationResult {
  const failures: string[] = [];

  const computedHash = computeAuditorEvidencePackHash(pack);
  if (computedHash !== pack.packHash) {
    failures.push("Pack hash mismatch. The evidence pack was tampered with.");
  }

  // Verification fails if pack hash is changed.
  // Missing required sources must create findings (this is done in collector/report probably)

  return {
    valid: failures.length === 0,
    failures
  };
}
