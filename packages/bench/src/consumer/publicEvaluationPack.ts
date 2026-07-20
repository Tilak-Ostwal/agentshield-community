import { z } from "zod";

export const PublicEvaluationPackSchema = z.object({
  version: z.literal(1),
  evaluationId: z.string(),
  name: z.string(),
  description: z.string(),
  consumerProjectPath: z.string(),
  checks: z.array(z.object({
    checkId: z.string(),
    name: z.string(),
    command: z.string(),
    required: z.boolean(),
    evidence: z.array(z.string())
  })),
  scoring: z.object({
    maxScore: z.number(),
    minimumPassingScore: z.number(),
    criticalFailureFailsEvaluation: z.boolean()
  }),
  limitations: z.array(z.string())
});

export type PublicEvaluationPack = z.infer<typeof PublicEvaluationPackSchema>;
