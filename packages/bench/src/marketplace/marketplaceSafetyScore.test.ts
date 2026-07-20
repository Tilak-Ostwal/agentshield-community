import { describe, it, expect } from "vitest";
import { calculateMarketplaceSafetyScore } from "./marketplaceSafetyScore.js";
import { MarketplaceEntry } from "./marketplaceEntrySchema.js";

describe("marketplaceSafetyScore", () => {
  const baseEntry: MarketplaceEntry = {
    version: 1,
    entryId: "test",
    name: "Test",
    description: "Test",
    packId: "test",
    packPath: "test.pack.json",
    publisher: { name: "Test", type: "maintainer" },
    safetyLevel: "strict",
    maturity: "reviewed",
    compatibleWorkspaceProfiles: ["strict"],
    requiredChecks: {
      schemaValidation: true,
      policyAudit: true,
      policyTest: true,
      reviewRecord: true,
      bundleRecommended: true
    },
    riskNotes: [],
    limitations: ["Not a legal compliance certification."]
  };

  const safePack = JSON.stringify({
    version: 1,
    packId: "test",
    description: "test",
    defaultEffect: "deny",
    rules: [
      { id: "1", effect: "allow", action: "test", resource: "test" }
    ]
  });

  it("safety score is deterministic (100)", () => {
    const res = calculateMarketplaceSafetyScore(baseEntry, safePack);
    expect(res.score).toBe(100);
    expect(res.valid).toBe(true);
  });

  it("safety score fails unsafe broad allow", () => {
    const unsafePack = JSON.stringify({
      version: 1, packId: "test", description: "test", defaultEffect: "deny",
      rules: [
        { id: "1", effect: "allow", action: "*", resource: "*" }
      ]
    });
    const res = calculateMarketplaceSafetyScore(baseEntry, unsafePack);
    expect(res.score).toBe(0);
    expect(res.valid).toBe(false);
  });

  it("safety score warns unknown publisher", () => {
    const entry = { ...baseEntry, publisher: { name: "Unknown", type: "unknown" as const } };
    const res = calculateMarketplaceSafetyScore(entry, safePack);
    expect(res.score).toBe(80);
    expect(res.valid).toBe(true);
  });

  it("safety score warns missing bundle/provenance", () => {
    const entry = { ...baseEntry, requiredChecks: { ...baseEntry.requiredChecks, bundleRecommended: false } };
    const res = calculateMarketplaceSafetyScore(entry, safePack);
    expect(res.score).toBe(90);
    expect(res.valid).toBe(true);
  });

  it("dev-warning-mode cannot claim production readiness", () => {
    const warnPack = JSON.stringify({
      version: 1, packId: "test", description: "test", defaultEffect: "deny",
      rules: [
        { id: "1", effect: "warn", action: "test", resource: "test" }
      ]
    });
    const res = calculateMarketplaceSafetyScore(baseEntry, warnPack);
    expect(res.score).toBe(0);
    expect(res.valid).toBe(false);
  });
});
