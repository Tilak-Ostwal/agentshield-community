import { createHmac } from "node:crypto";
import type { PolicyBundle } from "./policyBundleSchema.js";
import { computeBundleSignaturePayload, hashPolicyBundlePayload } from "./policyBundleHash.js";

const TEST_KEY = "sk-test" + "-REDACT-ME" + "-bundle-signer";

export interface BundleVerificationResult {
  valid: boolean;
  failures: string[];
}

export function verifyPolicyBundle(bundle: PolicyBundle): BundleVerificationResult {
  const failures: string[] = [];

  if (bundle.attestation.algorithm !== "HMAC-SHA256-TEST-ONLY") {
    failures.push("Unsupported signature algorithm");
  }

  // Verify policy hash
  const computedPolicyHash = hashPolicyBundlePayload(bundle.policy);
  if (computedPolicyHash !== bundle.provenance.policyHash) {
    failures.push("Policy hash mismatch. The policy was modified.");
  }

  // Verify missing provenance
  if (!bundle.provenance.source || !bundle.provenance.sourceId) {
    failures.push("Missing required provenance fields");
  }

  // Verify signature
  const payloadToSign = computeBundleSignaturePayload(bundle);
  const hmac = createHmac("sha256", TEST_KEY);
  hmac.update(payloadToSign);
  const computedSignature = hmac.digest("hex");

  if (computedSignature !== bundle.attestation.signature) {
    failures.push("Signature mismatch. Bundle was tampered with.");
  }

  return {
    valid: failures.length === 0,
    failures
  };
}
