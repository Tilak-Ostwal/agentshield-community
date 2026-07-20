import { hashCanonical } from "@agentshield/core";
import type { AuditorEvidencePack } from "./auditorEvidencePackSchema.js";

export function computeAuditorEvidencePackHash(pack: Omit<AuditorEvidencePack, "packHash"> | AuditorEvidencePack): string {
  const payload = { ...pack };
  if ("packHash" in payload) {
    delete (payload as any).packHash;
  }
  return hashCanonical(payload);
}
