import { describe, expect, it } from "vitest";
import { hashRegistryBundlePayload, computeRegistryBundleSignaturePayload } from "./registryBundleHash.js";

describe("registryBundleHash", () => {
  it("canonical registry hash is deterministic", () => {
    const hash1 = hashRegistryBundlePayload({ a: 1, b: 2 });
    const hash2 = hashRegistryBundlePayload({ b: 2, a: 1 });
    expect(hash1).toBe(hash2);
  });
  it("same bundle hashes identically across runs", () => {
    const bundle: any = { version: 1, registry: {}, provenance: {}, attestation: { signature: "a" } };
    const hash1 = computeRegistryBundleSignaturePayload(bundle);
    const hash2 = computeRegistryBundleSignaturePayload({ ...bundle, attestation: { signature: "b" } });
    expect(hash1).toBe(hash2);
  });
});
