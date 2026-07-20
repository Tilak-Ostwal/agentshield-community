import { describe, expect, it } from "vitest";
import { computeAuditorEvidencePackHash } from "./auditorEvidenceHash.js";
import type { AuditorEvidencePack } from "./auditorEvidencePackSchema.js";
import { verifyAuditorEvidencePack } from "./auditorEvidenceVerifier.js";

describe("auditorEvidenceVerifier", () => {
  it("changing evidence pack contents fails verification", () => {
    const pack: AuditorEvidencePack = {
      version: 1,
      packId: "pack-1",
      createdAt: "2026-06-29T00:00:00.000Z",
      checks: {},
      evidence: { traceBundlesVerified: true, rawSecretLeakDetected: false, redactionRequired: true },
      limitations: [],
      packHash: ""
    };
    pack.packHash = computeAuditorEvidencePackHash(pack);

    // change content
    pack.evidence.traceBundlesVerified = false;
    const result = verifyAuditorEvidencePack(pack);
    expect(result.valid).toBe(false);
  });

  it("changing packHash fails verification", () => {
    const pack: AuditorEvidencePack = {
      version: 1,
      packId: "pack-1",
      createdAt: "2026-06-29T00:00:00.000Z",
      checks: {},
      evidence: { traceBundlesVerified: true, rawSecretLeakDetected: false, redactionRequired: true },
      limitations: [],
      packHash: ""
    };
    pack.packHash = computeAuditorEvidencePackHash(pack);

    pack.packHash = "invalid";
    const result = verifyAuditorEvidencePack(pack);
    expect(result.valid).toBe(false);
  });
});
