import type { PolicyV2 } from "../policy/v2/policyV2Schema.js";
import type { PolicyProvenance } from "./policyBundleSchema.js";
import { hashPolicyBundlePayload } from "./policyBundleHash.js";

export interface ProvenanceOptions {
  source: "policy-pack" | "template" | "manual";
  sourceId: string;
  workspaceProfile?: string;
  notes?: string[];
  policyPackHash?: string;
}

export function generatePolicyProvenance(policy: PolicyV2, options: ProvenanceOptions): PolicyProvenance {
  // We need to compute the hash of the policy using the canonical hash function
  // We will pass the policy alone to hashPolicyBundlePayload, or we just stringify for now.
  const policyHash = hashPolicyBundlePayload(policy);
  return {
    source: options.source,
    sourceId: options.sourceId,
    workspaceProfile: options.workspaceProfile,
    generatedBy: "agentshield",
    generatorVersion: "0.0.0",
    policyHash,
    policyPackHash: options.policyPackHash,
    notes: options.notes
  };
}
