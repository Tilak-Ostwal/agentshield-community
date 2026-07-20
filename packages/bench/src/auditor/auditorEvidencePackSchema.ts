import { z } from "zod";

export const auditorEvidencePackSchema = z.object({
  version: z.literal(1),
  packId: z.string().min(1),
  createdAt: z.string().min(1),
  workspace: z.object({
    workspaceConfigPath: z.string().optional(),
    profile: z.string().optional()
  }).optional(),
  policy: z.object({
    policyPath: z.string().optional(),
    policyBundlePath: z.string().optional(),
    policyHash: z.string().optional(),
    policyBundleVerified: z.boolean().optional()
  }).optional(),
  registry: z.object({
    registryPath: z.string().optional(),
    registryBundlePath: z.string().optional(),
    registryHash: z.string().optional(),
    registryBundleVerified: z.boolean().optional()
  }).optional(),
  checks: z.object({
    releaseCheck: z.object({
      passed: z.boolean(),
      total: z.number()
    }).optional(),
    benchmark: z.object({
      passed: z.boolean(),
      totalScenarios: z.number(),
      failed: z.number()
    }).optional(),
    policyAudit: z.object({
      passed: z.boolean(),
      critical: z.number(),
      high: z.number()
    }).optional(),
    policyTest: z.object({
      passed: z.boolean(),
      total: z.number(),
      failed: z.number()
    }).optional(),
    adapterConformance: z.object({
      certification: z.enum(["passed", "failed", "unknown"]),
      total: z.number(),
      failed: z.number()
    }).optional(),
    securityFuzz: z.object({
      certification: z.enum(["passed", "failed", "unknown"]),
      criticalFailed: z.number()
    }).optional(),
    redteamCoverage: z.object({
      passed: z.boolean(),
      totalScenarios: z.number()
    }).optional()
  }).strict(),
  evidence: z.object({
    traceBundlesVerified: z.boolean(),
    rawSecretLeakDetected: z.boolean(),
    redactionRequired: z.boolean(),
    attackGraphExplanationSummary: z.string().optional(),
    incidentReportSummary: z.string().optional()
  }).strict(),
  limitations: z.array(z.string()),
  packHash: z.string()
}).strict();

export type AuditorEvidencePack = z.infer<typeof auditorEvidencePackSchema>;

export function parseAuditorEvidencePack(input: unknown): AuditorEvidencePack {
  return auditorEvidencePackSchema.parse(input);
}
