import { hashCanonical } from "../evidence/hashChain.js";
import { type PolicyBundle } from "./policyBundleSchema.js";

export function hashPolicyBundlePayload(payload: unknown): string {
  return hashCanonical(payload);
}

export function computeBundleSignaturePayload(bundle: PolicyBundle): string {
  const { attestation: _attestation, ...rest } = bundle;
  return hashCanonical(rest);
}
