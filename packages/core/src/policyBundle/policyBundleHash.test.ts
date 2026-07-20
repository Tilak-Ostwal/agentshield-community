import { describe, expect, it } from "vitest";
import { hashPolicyBundlePayload, computeBundleSignaturePayload } from "./policyBundleHash.js";

describe("policyBundleHash", () => {
  it("deterministic policy hash", () => {
    const hash1 = hashPolicyBundlePayload({ a: 1, b: 2 });
    const hash2 = hashPolicyBundlePayload({ b: 2, a: 1 });
    expect(hash1).toBe(hash2);
  });
  it("same bundle hashes identically across runs", () => {
    const bundle: any = { version: 1, policy: {}, provenance: {}, attestation: { signature: "sig" } };
    const hash1 = computeBundleSignaturePayload(bundle);
    const hash2 = computeBundleSignaturePayload({ ...bundle, attestation: { signature: "other" } });
    expect(hash1).toBe(hash2);
  });
});
