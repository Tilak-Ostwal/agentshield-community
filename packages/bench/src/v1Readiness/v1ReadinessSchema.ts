import { z } from "zod";
import { createHash } from "crypto";

export const v1ReadinessSchema = z.object({
  version: z.literal(1),
  readinessId: z.string(),
  createdAt: z.string().datetime(),
  status: z.enum(["ready", "ready_with_warnings", "blocked"]),
  score: z.object({
    value: z.number(),
    max: z.number(),
    grade: z.enum(["pass", "warning", "fail"]),
  }),
  domains: z.array(z.any()), // Defined in readinessDomain.ts
  releaseBlockers: z.array(z.any()), // Defined in releaseBlocker.ts
  gapClosurePlan: z.array(z.any()), // Defined in gapClosurePlanner.ts
  productionBoundary: z.object({
    betaReady: z.array(z.string()),
    v1Ready: z.array(z.string()),
    mockOnly: z.array(z.string()),
    futureProductionWork: z.array(z.string()),
  }),
  limitations: z.array(z.string()),
  readinessHash: z.string(),
});

export type V1ReadinessReport = z.infer<typeof v1ReadinessSchema>;

export function generateReadinessHash(report: Omit<V1ReadinessReport, "readinessHash">): string {
  const json = JSON.stringify(report);
  return createHash("sha256").update(json).digest("hex");
}
