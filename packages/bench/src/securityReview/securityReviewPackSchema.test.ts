import { describe, it, expect } from "vitest";
import { parseSecurityReviewPack } from "./securityReviewPackSchema.js";

describe("securityReviewPackSchema", () => {
  it("parses a valid pack", () => {
    const valid = {
      version: 1,
      reviewPackId: "agentshield-external-security-review-v1",
      name: "AgentShield Veritas External Security Review Pack",
      createdAt: "2026-06-29T00:00:00.000Z",
      scope: {
        included: ["deterministic policy evaluation"],
        excluded: ["hosted SaaS security"],
      },
      claimsBoundary: {
        allowedClaims: ["local deterministic security verification"],
        forbiddenClaims: ["SOC2 certified"],
      },
      evidenceArtifacts: ["release-check"],
      requiredReviewCommands: ["pnpm build"],
      limitations: ["Local deterministic review pack only."],
      packHash: "dummy-hash",
    };
    expect(() => parseSecurityReviewPack(valid)).not.toThrow();
  });
  
  it("rejects invalid pack", () => {
    expect(() => parseSecurityReviewPack({})).toThrow();
  });
});
