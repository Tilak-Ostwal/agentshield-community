import { describe, it, expect } from "vitest";
import { MarketplaceEntrySchema } from "./marketplaceEntrySchema.js";

describe("marketplaceEntrySchema", () => {
  it("parses valid entry", () => {
    const data = {
      version: 1,
      entryId: "strict-mcp-local",
      name: "Strict MCP Local",
      description: "A strict local MCP policy pack for safe local agent development.",
      packId: "strict-mcp-local",
      packPath: "examples/policy-packs/strict-mcp-local.pack.json",
      publisher: {
        name: "AgentShield Maintainers",
        type: "maintainer"
      },
      safetyLevel: "strict",
      maturity: "reviewed",
      compatibleWorkspaceProfiles: ["strict", "enterprise"],
      requiredChecks: {
        schemaValidation: true,
        policyAudit: true,
        policyTest: true,
        reviewRecord: true,
        bundleRecommended: true
      },
      riskNotes: [],
      limitations: [
        "Local deterministic marketplace entry only.",
        "Not a legal compliance certification."
      ]
    };
    const res = MarketplaceEntrySchema.safeParse(data);
    expect(res.success).toBe(true);
  });

  it("invalid marketplace entry is rejected", () => {
    const res = MarketplaceEntrySchema.safeParse({ version: "1" });
    expect(res.success).toBe(false);
  });
});
