import { z } from "zod";

import { parseScoringProfile, type ScoringProfileName } from "../scoring/scoringProfile.js";

export interface CiConfig {
  version: 1;
  profile: ScoringProfileName;
  failOnCritical: boolean;
  failOnHigh: boolean;
  minimumScorePercentage: number;
  requireEvidence: boolean;
  sarifOutput?: string;
  evidenceOutput?: string;
  markdownOutput?: string;
}

export const defaultCiConfig: CiConfig = {
  version: 1,
  profile: "strict",
  failOnCritical: true,
  failOnHigh: false,
  minimumScorePercentage: 100,
  requireEvidence: false
};

const ciConfigSchema = z.object({
  version: z.literal(1),
  profile: z.enum(["strict", "balanced", "audit", "dev"]).optional(),
  failOnCritical: z.boolean().optional(),
  failOnHigh: z.boolean().optional(),
  minimumScorePercentage: z.number().min(0).max(100).optional(),
  requireEvidence: z.boolean().optional(),
  sarifOutput: z.string().min(1).optional(),
  evidenceOutput: z.string().min(1).optional(),
  markdownOutput: z.string().min(1).optional()
}).strict();

export interface CiConfigParseResult {
  ok: boolean;
  config?: CiConfig;
  errors: string[];
}

export function parseCiConfig(input: unknown): CiConfigParseResult {
  const parsed = ciConfigSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      errors: parsed.error.issues.map((issue) => `${issue.path.join(".") || "config"}: ${issue.message}`)
    };
  }

  return {
    ok: true,
    config: {
      version: 1,
      profile: parsed.data.profile === undefined ? defaultCiConfig.profile : parseScoringProfile(parsed.data.profile),
      failOnCritical: parsed.data.failOnCritical ?? defaultCiConfig.failOnCritical,
      failOnHigh: parsed.data.failOnHigh ?? defaultCiConfig.failOnHigh,
      minimumScorePercentage: parsed.data.minimumScorePercentage ?? defaultCiConfig.minimumScorePercentage,
      requireEvidence: parsed.data.requireEvidence ?? defaultCiConfig.requireEvidence,
      ...(parsed.data.sarifOutput === undefined ? {} : { sarifOutput: parsed.data.sarifOutput }),
      ...(parsed.data.evidenceOutput === undefined ? {} : { evidenceOutput: parsed.data.evidenceOutput }),
      ...(parsed.data.markdownOutput === undefined ? {} : { markdownOutput: parsed.data.markdownOutput })
    },
    errors: []
  };
}
