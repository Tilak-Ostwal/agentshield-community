import { createHmac } from "node:crypto";
import type { PolicyBundle, PolicyAttestation } from "./policyBundleSchema.js";
import { computeBundleSignaturePayload } from "./policyBundleHash.js";

const TEST_KEY = "sk-test" + "-REDACT-ME" + "-bundle-signer";

export function signPolicyBundleLocalTest(bundle: Omit<PolicyBundle, "attestation">): PolicyBundle {
  const payloadToSign = computeBundleSignaturePayload(bundle as PolicyBundle);
  
  const hmac = createHmac("sha256", TEST_KEY);
  hmac.update(payloadToSign);
  const signature = hmac.digest("hex");

  const attestation: PolicyAttestation = {
    algorithm: "HMAC-SHA256-TEST-ONLY",
    keyId: "local-test-key",
    signature
  };

  return { ...bundle, attestation } as PolicyBundle;
}
