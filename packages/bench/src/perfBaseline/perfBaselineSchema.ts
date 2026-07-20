import { z } from "zod";

export const perfMeasurementSchema = z.object({
  id: z.string(),
  category: z.string(),
  operation: z.string(),
  budgetMs: z.number().optional(),
  observedMs: z.number(),
  sampleCount: z.number(),
  status: z.enum(["pass", "fail", "warning"]).optional()
});

export const perfBaselineSchema = z.object({
  version: z.literal(1),
  baselineId: z.string(),
  createdAt: z.string(),
  environment: z.object({
    mode: z.string(),
    nodeMajor: z.string(),
    notes: z.array(z.string())
  }),
  budgets: z.record(z.number()),
  measurements: z.array(perfMeasurementSchema),
  limitations: z.array(z.string()),
  baselineHash: z.string().optional()
});

export const perfCurrentRunSchema = z.object({
  version: z.literal(1),
  runId: z.string(),
  createdAt: z.string(),
  measurements: z.array(perfMeasurementSchema),
  runHash: z.string().optional()
});

export type PerfBaseline = z.infer<typeof perfBaselineSchema>;
export type PerfCurrentRun = z.infer<typeof perfCurrentRunSchema>;
export type PerfMeasurement = z.infer<typeof perfMeasurementSchema>;
