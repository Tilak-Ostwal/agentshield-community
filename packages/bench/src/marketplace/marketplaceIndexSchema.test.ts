import { describe, it, expect } from "vitest";
import { MarketplaceIndexSchema } from "./marketplaceIndexSchema.js";

describe("marketplaceIndexSchema", () => {
  it("parses valid index", () => {
    const data = {
      version: 1,
      indexId: "agentshield-local-marketplace",
      name: "AgentShield Local Policy Marketplace",
      entries: [
        "entries/strict-mcp-local.marketplace.json"
      ],
      createdAt: "2026-06-29T00:00:00.000Z",
      limitations: [
        "Local-only index.",
        "No hosted marketplace or remote trust root."
      ]
    };
    const res = MarketplaceIndexSchema.safeParse(data);
    expect(res.success).toBe(true);
  });

  it("invalid marketplace index is rejected", () => {
    const res = MarketplaceIndexSchema.safeParse({});
    expect(res.success).toBe(false);
  });
});
