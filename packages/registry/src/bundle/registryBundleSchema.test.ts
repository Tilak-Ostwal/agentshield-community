import { describe, expect, it } from "vitest";
import { parseRegistryBundle } from "./registryBundleSchema.js";

describe("registryBundleSchema", () => {
  it("registry bundle schema parses valid bundle", () => {
    const bundle = {
      version: 1,
      bundleId: "test",
      name: "test",
      createdAt: "2026-06-29T00:00:00.000Z",
      registry: { version: 1, name: "t", generatedAt: "2026-06-29T00:00:00.000Z", entries: [] },
      provenance: {
        source: "manual",
        sourceId: "id",
        generatedBy: "agentshield",
        generatorVersion: "0.0.0",
        registryHash: "hash",
        toolCount: 0,
        trustedToolCount: 0,
        reviewedToolCount: 0,
        blockedToolCount: 0
      },
      attestation: {
        algorithm: "HMAC-SHA256-TEST-ONLY",
        keyId: "test",
        signature: "sig"
      }
    };
    expect(() => parseRegistryBundle(bundle)).not.toThrow();
  });
  it("invalid bundle is rejected", () => {
    expect(() => parseRegistryBundle({})).toThrow();
  });
});
