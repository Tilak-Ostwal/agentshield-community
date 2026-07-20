import { describe, expect, it } from "vitest";
import { computeAuditorEvidencePackHash } from "./auditorEvidenceHash.js";
import type { AuditorEvidencePack } from "./auditorEvidencePackSchema.js";

describe("auditorEvidenceHash", () => {
  it("evidence hash is deterministic", () => {
    const pack: Omit<AuditorEvidencePack, "packHash"> = {
      version: 1,
      packId: "pack-1",
      createdAt: "2026-06-29T00:00:00.000Z",
      checks: {},
      evidence: { traceBundlesVerified: true, rawSecretLeakDetected: false, redactionRequired: true },
      limitations: []
    };
    const h1 = computeAuditorEvidencePackHash(pack);
    const h2 = computeAuditorEvidencePackHash({ ...pack });
    expect(h1).toBe(h2);
  });
});
