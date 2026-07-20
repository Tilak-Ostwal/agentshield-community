import { describe, expect, it } from "vitest";
import { signPolicyBundleLocalTest } from "./policyBundleSigner.js";

describe("policyBundleSigner", () => {
  it("local test signer creates verifiable bundle", () => {
    const bundle: any = { version: 1, policy: {}, provenance: {} };
    const signed = signPolicyBundleLocalTest(bundle);
    expect(signed.attestation.signature).toBeDefined();
    expect(signed.attestation.algorithm).toBe("HMAC-SHA256-TEST-ONLY");
  });
});
