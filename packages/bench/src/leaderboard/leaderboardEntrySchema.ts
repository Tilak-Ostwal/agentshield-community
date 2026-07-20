import { z } from "zod";

export const LeaderboardEntrySchema = z.object({
  version: z.number().int().min(1),
  entryId: z.string().min(1),
  projectName: z.string().min(1),
  projectVersion: z.string().min(1),
  resultPath: z.string().min(1),
  score: z.number().min(0).max(100),
  grade: z.string().min(1),
  corpusVersion: z.string().min(1),
  verified: z.boolean(),
  verificationSummary: z.string(),
  limitations: z.array(z.string())
});

export type LeaderboardEntry = z.infer<typeof LeaderboardEntrySchema>;
