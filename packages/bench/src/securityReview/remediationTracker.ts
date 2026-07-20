import { z } from "zod";

export const remediationTrackerSchema = z.object({
  findingId: z.string(),
  status: z.enum(["open", "in-progress", "resolved", "wont-fix"]),
  resolutionNotes: z.string().optional(),
  resolvedAt: z.string().datetime().optional(),
});

export type RemediationTracker = z.infer<typeof remediationTrackerSchema>;

export function parseRemediationTracker(data: unknown): RemediationTracker {
  return remediationTrackerSchema.parse(data);
}
