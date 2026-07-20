import { describe, it, expect } from "vitest";
import { generateMarketplaceInstallPlan } from "./marketplaceInstallPlan.js";

describe("marketplaceInstallPlan", () => {
  it("install plan explains inspect/audit/bundle/workspace steps", () => {
    const entry = {
      version: 1, entryId: "test", name: "test", description: "test", packId: "test", packPath: "test.pack.json",
      publisher: { name: "Test", type: "maintainer" as const }, safetyLevel: "strict" as const, maturity: "reviewed" as const,
      compatibleWorkspaceProfiles: [], requiredChecks: { schemaValidation: true, policyAudit: true, policyTest: true, reviewRecord: true, bundleRecommended: true },
      riskNotes: [], limitations: []
    };
    const md = generateMarketplaceInstallPlan(entry);
    expect(md).toContain("Inspect the Policy Pack");
    expect(md).toContain("Audit the Policy");
    expect(md).toContain("Create a Policy Bundle");
    expect(md).toContain("Update Workspace Config");
  });

  it("install plan does not perform installation", () => {
    const entry = {
      version: 1, entryId: "test", name: "test", description: "test", packId: "test", packPath: "test.pack.json",
      publisher: { name: "Test", type: "maintainer" as const }, safetyLevel: "strict" as const, maturity: "reviewed" as const,
      compatibleWorkspaceProfiles: [], requiredChecks: { schemaValidation: true, policyAudit: true, policyTest: true, reviewRecord: true, bundleRecommended: true },
      riskNotes: [], limitations: []
    };
    const md = generateMarketplaceInstallPlan(entry);
    expect(md).toContain("AgentShield does not automatically install");
  });
});
