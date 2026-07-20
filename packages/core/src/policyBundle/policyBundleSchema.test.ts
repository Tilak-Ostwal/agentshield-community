import { describe, expect, it } from "vitest";
import { parsePolicyBundle } from "./policyBundleSchema.js";

describe("policyBundleSchema", () => {
  it("parses valid bundle", () => {
    const bundle = {
      version: 1,
      bundleId: "test-bundle",
      name: "Test Bundle",
      createdAt: "2026-06-29T00:00:00.000Z",
      policy: { version: 2, name: "test", mode: "strict", defaultDecision: "deny", rules: [] },
      provenance: {
        source: "manual",
        sourceId: "test",
        generatedBy: "agentshield",
        generatorVersion: "0.0.0",
        policyHash: "testhash"
      },
      attestation: {
        algorithm: "HMAC-SHA256-TEST-ONLY",
        keyId: "local-test-key",
        signature: "testsig"
      }
    };
    expect(() => parsePolicyBundle(bundle)).not.toThrow();
  });
  it("invalid bundle is rejected", () => {
    expect(() => parsePolicyBundle({})).toThrow();
  });
});
