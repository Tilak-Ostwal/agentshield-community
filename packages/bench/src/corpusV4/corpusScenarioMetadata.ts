import { z } from "zod";
export const corpusScenarioMetadataSchema = z.object({
  version: z.literal(4),
  scenarioId: z.string(),
  title: z.string(),
  category: z.string(),
  family: z.string(),
  severity: z.string(),
  difficulty: z.enum(["basic", "intermediate", "advanced", "expert"]),
  expectedFinalDecision: z.string(),
  expectedRiskMarkers: z.array(z.string()),
  attackStages: z.array(z.string()),
  controlsExercised: z.array(z.string()),
  provenance: z.object({
    source: z.string(),
    createdBy: z.string(),
    createdAt: z.string(),
    reviewStatus: z.enum(["reviewed", "draft"]),
    notes: z.array(z.string())
  }),
  limitations: z.array(z.string())
});
export type CorpusScenarioMetadata = z.infer<typeof corpusScenarioMetadataSchema>;
