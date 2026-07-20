import { z } from "zod";

import { trustLevelSchema } from "./trustLevel.js";

export const resourceScopeSchema = z.object({
  type: z.enum(["filesystem", "network", "secret", "env", "git", "browser", "database"]),
  allow: z.array(z.string().min(1)).optional(),
  deny: z.array(z.string().min(1)).optional()
}).strict();

export const expectedFingerprintSchema = z.object({
  schemaHash: z.string().regex(/^[a-f0-9]{64}$/),
  descriptionHash: z.string().regex(/^[a-f0-9]{64}$/),
  capabilityHash: z.string().regex(/^[a-f0-9]{64}$/)
}).strict();

export const registryEntrySchema = z.object({
  version: z.literal(1),
  toolName: z.string().min(1),
  serverName: z.string().min(1),
  trustLevel: trustLevelSchema,
  expectedFingerprint: expectedFingerprintSchema,
  declaredCapabilities: z.array(z.string().min(1)).default([]),
  allowedResourceScopes: z.array(resourceScopeSchema).optional(),
  riskLevel: z.enum(["low", "medium", "high", "critical"]),
  reviewedAt: z.string().min(1).optional(),
  reviewedBy: z.string().min(1).optional(),
  notes: z.string().optional()
}).strict();

export type RegistryEntry = z.infer<typeof registryEntrySchema>;

export function registryEntryKey(entry: Pick<RegistryEntry, "serverName" | "toolName">): string {
  return `${entry.serverName}:${entry.toolName}`;
}
