import { z } from "zod";
import { registryFileSchema } from "../registryFile.js";

export const registryProvenanceSchema = z.object({
  source: z.enum(["manual", "generated", "workspace"]),
  sourceId: z.string(),
  workspaceProfile: z.string().optional(),
  generatedBy: z.string(),
  generatorVersion: z.string(),
  registryHash: z.string(),
  toolCount: z.number(),
  trustedToolCount: z.number(),
  reviewedToolCount: z.number(),
  blockedToolCount: z.number(),
  notes: z.array(z.string()).optional()
}).strict();

export const registryAttestationSchema = z.object({
  algorithm: z.enum(["HMAC-SHA256-TEST-ONLY"]),
  keyId: z.string(),
  signature: z.string()
}).strict();

export const registryBundleSchema = z.object({
  version: z.literal(1),
  bundleId: z.string(),
  name: z.string(),
  createdAt: z.string().datetime(),
  registry: registryFileSchema,
  provenance: registryProvenanceSchema,
  attestation: registryAttestationSchema
}).strict();

export type RegistryProvenance = z.infer<typeof registryProvenanceSchema>;
export type RegistryAttestation = z.infer<typeof registryAttestationSchema>;
export type RegistryBundle = z.infer<typeof registryBundleSchema>;

export function parseRegistryBundle(data: unknown): RegistryBundle {
  return registryBundleSchema.parse(data);
}
