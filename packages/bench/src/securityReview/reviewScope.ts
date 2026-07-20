import { z } from "zod";

export const reviewScopeSchema = z.object({
  includedComponents: z.array(z.string()),
  excludedComponents: z.array(z.string()),
  systemBoundaries: z.array(z.string()),
});

export type ReviewScope = z.infer<typeof reviewScopeSchema>;

export function parseReviewScope(data: unknown): ReviewScope {
  return reviewScopeSchema.parse(data);
}
