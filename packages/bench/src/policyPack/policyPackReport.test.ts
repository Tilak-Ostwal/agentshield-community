import { describe, expect, it } from "vitest";

import { auditPolicyPack, generatePolicyPackAuditText, generatePolicyPackListText } from "./policyPackReport.js";

describe("policy pack report", () => {
  it("generated strict pack policy passes policy-audit", () => {
    expect(auditPolicyPack("strict-mcp-local").ok).toBe(true);
  });

  it("formats list and audit without raw fake secrets", () => {
    expect(generatePolicyPackListText()).toContain("strict-mcp-local");
    expect(generatePolicyPackAuditText(auditPolicyPack("enterprise-sensitive-data"))).not.toContain("sk-test-REDACT-ME");
  });
});
