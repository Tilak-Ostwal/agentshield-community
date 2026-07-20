import { z } from "zod";

export const LeaderboardResultSchema = z.object({
  version: z.number().int().min(1),
  resultId: z.string().min(1),
  createdAt: z.string().datetime(),
  project: z.object({
    name: z.string().min(1),
    version: z.string().min(1),
    environment: z.string().min(1)
  }),
  corpus: z.object({
    corpusVersion: z.string().min(1),
    scenarioCount: z.number().int().min(0),
    corpusHash: z.string().min(1),
    categories: z.array(z.string())
  }),
  run: z.object({
    profile: z.string().min(1),
    totalScenarios: z.number().int().min(0),
    passed: z.number().int().min(0),
    failed: z.number().int().min(0),
    weightedScore: z.number().min(0).max(100),
    normalizedScore: z.number().min(0).max(100),
    criticalFailures: z.number().int().min(0),
    highFailures: z.number().int().min(0)
  }),
  checks: z.object({
    benchCi: z.boolean(),
    redteamCoverage: z.boolean(),
    securityFuzz: z.boolean(),
    releaseCandidateCheck: z.boolean()
  }),
  limitations: z.array(z.string()),
  resultHash: z.string().min(1)
});

export type LeaderboardResult = z.infer<typeof LeaderboardResultSchema>;
