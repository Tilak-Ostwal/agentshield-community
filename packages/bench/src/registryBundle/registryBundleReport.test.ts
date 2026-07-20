import { describe, expect, it } from "vitest";
import { formatRegistryBundleInspectText, formatRegistryBundleVerifyText } from "./registryBundleReport.js";

describe("registryBundleReport", () => {
  it("formats inspect text correctly", () => {
    const bundle: any = {
      bundleId: "test-id",
      name: "Test Bundle",
      createdAt: "2026-01-01",
      provenance: { source: "manual", sourceId: "id", toolCount: 1, trustedToolCount: 1, reviewedToolCount: 0, blockedToolCount: 0 },
      attestation: { signature: "abc" }
    };
    const out = formatRegistryBundleInspectText(bundle);
    expect(out).toContain("ID: test-id");
    expect(out).toContain("Tools: 1");
  });
  it("formats verify text correctly", () => {
    expect(formatRegistryBundleVerifyText(true, [])).toContain("PASS");
    expect(formatRegistryBundleVerifyText(false, ["Bad hash"])).toContain("FAIL");
    expect(formatRegistryBundleVerifyText(false, ["Bad hash"])).toContain("Bad hash");
  });
});
