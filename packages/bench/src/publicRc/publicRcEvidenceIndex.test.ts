import { describe, expect, it } from "vitest";
import { generateEvidenceIndex } from "./publicRcEvidenceIndex.js";
import { defaultPublicRcManifest } from "./publicRcManifest.js";

describe("publicRcEvidenceIndex", () => {
  it("evidence index includes all required evidence categories", () => {
    const index = generateEvidenceIndex();
    const ids = index.map(i => i.id);
    for (const req of defaultPublicRcManifest.requiredEvidence) {
      expect(ids).toContain(req);
    }
  });
});
