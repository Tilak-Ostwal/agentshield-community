import { describe, expect, it } from "vitest";
import { verifyPolicyBundle } from "./policyBundleVerifier.js";
import { signPolicyBundleLocalTest } from "./policyBundleSigner.js";
import { generatePolicyProvenance } from "./policyProvenance.js";

describe("policyBundleVerifier", () => {
  it("bundle created from policy verifies", () => {
    const policy: any = { version: 2, name: "test", mode: "strict", defaultDecision: "deny", rules: [] };
    const prov = generatePolicyProvenance(policy, { source: "manual", sourceId: "test" });
    const bundle = signPolicyBundleLocalTest({
      version: 1, bundleId: "b1", name: "n1", createdAt: new Date().toISOString(), policy, provenance: prov
    } as any);
    const result = verifyPolicyBundle(bundle);
    expect(result.valid).toBe(true);
  });

  it("changing policy causes verification failure", () => {
    const policy: any = { version: 2, name: "test", mode: "strict", defaultDecision: "deny", rules: [] };
    const prov = generatePolicyProvenance(policy, { source: "manual", sourceId: "test" });
    const bundle = signPolicyBundleLocalTest({
      version: 1, bundleId: "b1", name: "n1", createdAt: new Date().toISOString(), policy, provenance: prov
    } as any);
    (bundle.policy as any).defaultDecision = "allow";
    const result = verifyPolicyBundle(bundle);
    expect(result.valid).toBe(false);
    expect(result.failures).toContain("Policy hash mismatch. The policy was modified.");
  });

  it("changing provenance causes verification failure", () => {
    const policy: any = { version: 2, name: "test", mode: "strict", defaultDecision: "deny", rules: [] };
    const prov = generatePolicyProvenance(policy, { source: "manual", sourceId: "test" });
    const bundle = signPolicyBundleLocalTest({
      version: 1, bundleId: "b1", name: "n1", createdAt: new Date().toISOString(), policy, provenance: prov
    } as any);
    bundle.provenance.sourceId = "hacked";
    const result = verifyPolicyBundle(bundle);
    expect(result.valid).toBe(false);
    expect(result.failures).toContain("Signature mismatch. Bundle was tampered with.");
  });

  it("changing signature causes verification failure", () => {
    const policy: any = { version: 2, name: "test", mode: "strict", defaultDecision: "deny", rules: [] };
    const prov = generatePolicyProvenance(policy, { source: "manual", sourceId: "test" });
    const bundle = signPolicyBundleLocalTest({
      version: 1, bundleId: "b1", name: "n1", createdAt: new Date().toISOString(), policy, provenance: prov
    } as any);
    bundle.attestation.signature = "invalid";
    const result = verifyPolicyBundle(bundle);
    expect(result.valid).toBe(false);
    expect(result.failures).toContain("Signature mismatch. Bundle was tampered with.");
  });

  it("missing provenance fails verification", () => {
    const policy: any = { version: 2, name: "test", mode: "enforce", defaultDecision: "deny", rules: [] };
    const prov: any = { policyHash: "123" };
    const bundle = signPolicyBundleLocalTest({
      version: 1, bundleId: "b1", name: "n1", createdAt: new Date().toISOString(), policy, provenance: prov
    } as any);
    const result = verifyPolicyBundle(bundle);
    expect(result.valid).toBe(false);
    expect(result.failures).toContain("Missing required provenance fields");
  });
});
