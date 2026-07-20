import { describe, expect, it } from "vitest";
import { signRegistryBundleLocalTest } from "./registryBundleSigner.js";

describe("registryBundleSigner", () => {
  it("local test signer creates verifiable bundle", () => {
    const bundle: any = { version: 1, registry: {}, provenance: {} };
    const signed = signRegistryBundleLocalTest(bundle);
    expect(signed.attestation.signature).toBeDefined();
    expect(signed.attestation.algorithm).toBe("HMAC-SHA256-TEST-ONLY");
  });
});
