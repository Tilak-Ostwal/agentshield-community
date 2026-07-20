import { z } from "zod";

export const invariantCoverageMapSchema = z.object({
  invariants: z.array(
    z.object({
      id: z.string(),
      description: z.string(),
      covered: z.boolean(),
      notes: z.string().optional(),
    })
  ),
});

export type InvariantCoverageMap = z.infer<typeof invariantCoverageMapSchema>;

export function parseInvariantCoverageMap(data: unknown): InvariantCoverageMap {
  return invariantCoverageMapSchema.parse(data);
}
