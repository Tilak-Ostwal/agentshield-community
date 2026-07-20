import { z } from "zod";
import { policyV2Schema } from "../policy/v2/policyV2Schema.js";
import { compatibilityStatusSchema } from "../policy/migration/policyVersionCompatibility.js";

export const policyProvenanceSchema = z.object({
  source: z.enum(["policy-pack", "template", "manual"]),
  sourceId: z.string(),
  workspaceProfile: z.string().optional(),
  generatedBy: z.string(),
  generatorVersion: z.string(),
  policyHash: z.string(),
  policyPackHash: z.string().optional(),
  policyVersionCompatibility: compatibilityStatusSchema.optional(),
  notes: z.array(z.string()).optional()
}).strict();

export const policyAttestationSchema = z.object({
  algorithm: z.enum(["HMAC-SHA256-TEST-ONLY"]),
  keyId: z.string(),
  signature: z.string()
}).strict();

export const policyBundleSchema = z.object({
  version: z.literal(1),
  bundleId: z.string(),
  name: z.string(),
  createdAt: z.string().datetime(),
  policy: policyV2Schema,
  provenance: policyProvenanceSchema,
  attestation: policyAttestationSchema
}).strict();

export type PolicyProvenance = z.infer<typeof policyProvenanceSchema>;
export type PolicyAttestation = z.infer<typeof policyAttestationSchema>;
export type PolicyBundle = z.infer<typeof policyBundleSchema>;

export function parsePolicyBundle(data: unknown): PolicyBundle {
  return policyBundleSchema.parse(data);
}
