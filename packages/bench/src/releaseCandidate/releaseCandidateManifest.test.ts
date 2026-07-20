import { describe, expect, it } from "vitest";
import { releaseCandidateManifestSchema } from "./releaseCandidateManifest.js";

describe("releaseCandidateManifest", () => {
  it("beta manifest schema parses valid manifest", () => {
    const valid = {
      version: 1,
      releaseId: "v0.2.0-beta",
      name: "AgentShield Veritas v0.2.0 Beta Release Candidate",
      maturity: "beta",
      createdAt: "2026-06-29T00:00:00.000Z",
      requiredGates: {
        build: true,
        tests: true
      },
      evidenceArtifacts: [
        "auditor-evidence.json"
      ],
      nonCertificationDisclaimerRequired: true,
      knownLimitationsRequired: true,
      generatedFileCleanupRequired: true
    };
    expect(releaseCandidateManifestSchema.safeParse(valid).success).toBe(true);
  });
  
  it("invalid manifest is rejected", () => {
    expect(releaseCandidateManifestSchema.safeParse({}).success).toBe(false);
  });
});
