import { z } from "zod";

export const releaseCandidateManifestSchema = z.object({
  version: z.literal(1),
  releaseId: z.string(),
  name: z.string(),
  maturity: z.enum(["alpha", "beta", "release_candidate"]),
  createdAt: z.string(),
  requiredGates: z.object({
    build: z.boolean().optional(),
    tests: z.boolean().optional(),
    releaseCheck: z.boolean().optional(),
    benchCi: z.boolean().optional(),
    securityFuzz: z.boolean().optional(),
    redteamCoverage: z.boolean().optional(),
    policyPackAudit: z.boolean().optional(),
    policyBundleVerify: z.boolean().optional(),
    registryBundleVerify: z.boolean().optional(),
    workspaceValidate: z.boolean().optional(),
    recipeDoctor: z.boolean().optional(),
    sensitiveScan: z.boolean().optional(),
    adapterConformance: z.boolean().optional(),
    auditorExport: z.boolean().optional(),
    incidentReport: z.boolean().optional(),
    governance: z.boolean().optional(),
    marketplaceReady: z.boolean().optional(),
    docsSiteReady: z.boolean().optional(),
    corpusV4Ready: z.boolean().optional(),
    perfBaselineReady: z.boolean().optional(),
    supplyChainReady: z.boolean().optional(),
    securityReview: z.boolean().optional(),
    v1ReadinessReady: z.boolean().optional()
  }).optional(),
  evidenceArtifacts: z.array(z.string()).optional(),
  nonCertificationDisclaimerRequired: z.boolean().optional(),
  knownLimitationsRequired: z.boolean().optional(),
  generatedFileCleanupRequired: z.boolean().optional()
}).strict();

export type ReleaseCandidateManifest = z.infer<typeof releaseCandidateManifestSchema>;
