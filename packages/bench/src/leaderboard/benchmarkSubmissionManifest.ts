import { z } from "zod";

const UNSAFE_COMMAND_PATTERNS = [/npm (install|i|update|ci)/i, /pnpm (add|install|update|i)/i, /yarn (add|install|upgrade)/i, /curl/i, /wget/i, /bash -c/i];

export const BenchmarkSubmissionManifestSchema = z.object({
  version: z.number().int().min(1),
  submissionId: z.string().min(1),
  resultPath: z.string().min(1),
  leaderboardEntryPath: z.string().min(1),
  requiredArtifacts: z.array(z.string()),
  reproducibility: z.object({
    commands: z.array(z.string()).refine((commands) => {
      return commands.every(cmd => !UNSAFE_COMMAND_PATTERNS.some(pattern => pattern.test(cmd)));
    }, { message: "Contains unsafe reproducibility commands" }),
    networkRequired: z.boolean(),
    cloudRequired: z.boolean()
  })
});

export type BenchmarkSubmissionManifest = z.infer<typeof BenchmarkSubmissionManifestSchema>;
