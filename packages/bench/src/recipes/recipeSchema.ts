import { z } from "zod";

export const recipeControlSchema = z.object({
  controlId: z.string(),
  name: z.string(),
  coveredBy: z.array(z.string()),
  evidence: z.array(z.string()),
  limitations: z.array(z.string())
});

export const recipeSchema = z.object({
  version: z.literal(1),
  recipeId: z.string(),
  name: z.string(),
  description: z.string(),
  maturity: z.enum(["alpha", "beta", "release_candidate"]),
  recommendedFor: z.array(z.string()),
  requires: z.object({
    workspaceConfig: z.boolean().optional(),
    policyPack: z.boolean().optional(),
    policyBundle: z.boolean().optional(),
    registryBundle: z.boolean().optional(),
    securityFuzz: z.boolean().optional(),
    redteamCoverage: z.boolean().optional(),
    adapterConformance: z.boolean().optional(),
    incidentReport: z.boolean().optional(),
    auditorExport: z.boolean().optional(),
    releaseCheck: z.boolean().optional()
  }).optional(),
  commands: z.array(z.string()),
  evidenceArtifacts: z.array(z.string()),
  controls: z.array(recipeControlSchema),
  limitations: z.array(z.string())
}).strict();

export type RecipeControl = z.infer<typeof recipeControlSchema>;
export type EnterpriseRecipe = z.infer<typeof recipeSchema>;
