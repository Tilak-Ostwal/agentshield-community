import { z } from "zod";

export const securityReviewPackSchema = z.object({
  version: z.literal(1),
  reviewPackId: z.string(),
  name: z.string(),
  createdAt: z.string().datetime(),
  scope: z.object({
    included: z.array(z.string()),
    excluded: z.array(z.string()),
  }),
  claimsBoundary: z.object({
    allowedClaims: z.array(z.string()),
    forbiddenClaims: z.array(z.string()),
  }),
  evidenceArtifacts: z.array(z.string()),
  requiredReviewCommands: z.array(z.string()),
  limitations: z.array(z.string()),
  packHash: z.string(),
});

export type SecurityReviewPack = z.infer<typeof securityReviewPackSchema>;

export function parseSecurityReviewPack(data: unknown): SecurityReviewPack {
  return securityReviewPackSchema.parse(data);
}
