import { describe, expect, it } from "vitest";
import { verifyRegistryBundle } from "./registryBundleVerifier.js";
import { signRegistryBundleLocalTest } from "./registryBundleSigner.js";
import { generateRegistryProvenance } from "./registryProvenance.js";

function getMockRegistry(): any {
  return {
    version: 1,
    name: "test-registry",
    generatedAt: "2026-06-29T00:00:00.000Z",
    entries: [
      {
        version: 1,
        toolName: "testTool",
        serverName: "testServer",
        trustLevel: "trusted",
        expectedFingerprint: { schemaHash: "0000000000000000000000000000000000000000000000000000000000000000", descriptionHash: "0000000000000000000000000000000000000000000000000000000000000000", capabilityHash: "0000000000000000000000000000000000000000000000000000000000000000" },
        declaredCapabilities: ["c1"],
        riskLevel: "low"
      }
    ]
  };
}

describe("registryBundleVerifier", () => {
  it("bundle created from registry verifies", () => {
    const reg = getMockRegistry();
    const prov = generateRegistryProvenance(reg, { source: "manual", sourceId: "id" });
    const bundle = signRegistryBundleLocalTest({ version: 1, bundleId: "b1", name: "n1", createdAt: new Date().toISOString(), registry: reg, provenance: prov } as any);
    const result = verifyRegistryBundle(bundle);
    expect(result.valid).toBe(true);
  });

  it("changing a tool fingerprint causes verification failure", () => {
    const reg = getMockRegistry();
    const prov = generateRegistryProvenance(reg, { source: "manual", sourceId: "id" });
    const bundle = signRegistryBundleLocalTest({ version: 1, bundleId: "b1", name: "n1", createdAt: new Date().toISOString(), registry: reg, provenance: prov } as any);
    bundle.registry.entries[0]!.expectedFingerprint.schemaHash = "hacked";
    const result = verifyRegistryBundle(bundle);
    expect(result.valid).toBe(false);
    expect(result.failures).toContain("Registry hash mismatch. The registry was modified.");
  });

  it("changing trust level causes verification failure", () => {
    const reg = getMockRegistry();
    const prov = generateRegistryProvenance(reg, { source: "manual", sourceId: "id" });
    const bundle = signRegistryBundleLocalTest({ version: 1, bundleId: "b1", name: "n1", createdAt: new Date().toISOString(), registry: reg, provenance: prov } as any);
    bundle.registry.entries[0]!.trustLevel = "blocked";
    const result = verifyRegistryBundle(bundle);
    expect(result.valid).toBe(false);
  });

  it("changing capabilities causes verification failure", () => {
    const reg = getMockRegistry();
    const prov = generateRegistryProvenance(reg, { source: "manual", sourceId: "id" });
    const bundle = signRegistryBundleLocalTest({ version: 1, bundleId: "b1", name: "n1", createdAt: new Date().toISOString(), registry: reg, provenance: prov } as any);
    bundle.registry.entries[0]!.declaredCapabilities.push("c2");
    const result = verifyRegistryBundle(bundle);
    expect(result.valid).toBe(false);
  });

  it("changing provenance causes verification failure", () => {
    const reg = getMockRegistry();
    const prov = generateRegistryProvenance(reg, { source: "manual", sourceId: "id" });
    const bundle = signRegistryBundleLocalTest({ version: 1, bundleId: "b1", name: "n1", createdAt: new Date().toISOString(), registry: reg, provenance: prov } as any);
    bundle.provenance.toolCount = 999;
    const result = verifyRegistryBundle(bundle);
    expect(result.valid).toBe(false);
    expect(result.failures).toContain("Signature mismatch. Bundle was tampered with.");
  });

  it("changing signature causes verification failure", () => {
    const reg = getMockRegistry();
    const prov = generateRegistryProvenance(reg, { source: "manual", sourceId: "id" });
    const bundle = signRegistryBundleLocalTest({ version: 1, bundleId: "b1", name: "n1", createdAt: new Date().toISOString(), registry: reg, provenance: prov } as any);
    bundle.attestation.signature = "invalid";
    const result = verifyRegistryBundle(bundle);
    expect(result.valid).toBe(false);
    expect(result.failures).toContain("Signature mismatch. Bundle was tampered with.");
  });

  it("missing provenance fails verification", () => {
    const reg = getMockRegistry();
    const prov: any = { registryHash: "123" };
    const bundle = signRegistryBundleLocalTest({ version: 1, bundleId: "b1", name: "n1", createdAt: new Date().toISOString(), registry: reg, provenance: prov } as any);
    const result = verifyRegistryBundle(bundle);
    expect(result.valid).toBe(false);
    expect(result.failures).toContain("Missing required provenance fields");
  });
});
