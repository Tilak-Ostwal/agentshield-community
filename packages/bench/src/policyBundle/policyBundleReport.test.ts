import { describe, expect, it } from "vitest";
import { formatPolicyBundleVerifyText, formatPolicyBundleVerifyJson, formatPolicyBundleInspectText, formatPolicyBundleInspectJson } from "./policyBundleReport.js";

describe("policyBundleReport", () => {
  it("inspect report text works", () => {
    const bundle = { bundleId: "b1", name: "n1", createdAt: "now", provenance: { source: "manual", sourceId: "id" }, attestation: { signature: "sig" } };
    expect(formatPolicyBundleInspectText(bundle)).toContain("b1");
  });
  it("inspect report JSON works", () => {
    const bundle = { bundleId: "b1", name: "n1", createdAt: "now", provenance: { source: "manual", sourceId: "id" }, attestation: { signature: "sig" } };
    expect(formatPolicyBundleInspectJson(bundle)).toContain("b1");
  });
  it("verify CLI text works", () => {
    expect(formatPolicyBundleVerifyText({ valid: true, failures: [] })).toContain("PASS");
    expect(formatPolicyBundleVerifyText({ valid: false, failures: ["Fail"] })).toContain("FAIL");
  });
  it("verify CLI JSON works", () => {
    expect(formatPolicyBundleVerifyJson({ valid: true, failures: [] })).toContain("true");
  });
});
