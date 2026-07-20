import { z } from "zod";

export const evidenceIndexSchema = z.object({
  id: z.string(),
  description: z.string(),
  files: z.array(z.string()),
  commands: z.array(z.string()),
});

export type EvidenceIndex = z.infer<typeof evidenceIndexSchema>;

export function parseEvidenceIndex(data: unknown): EvidenceIndex {
  return evidenceIndexSchema.parse(data);
}
