import { z } from "zod";
export const scenarioProvenanceSchema = z.object({
  source: z.string(),
  createdBy: z.string(),
  createdAt: z.string(),
  reviewStatus: z.enum(["reviewed", "draft"]),
  notes: z.array(z.string())
});
export type ScenarioProvenance = z.infer<typeof scenarioProvenanceSchema>;
