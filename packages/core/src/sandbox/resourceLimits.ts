import { z } from "zod";

export const resourceLimitsSchema = z
  .object({
    maxExecutionMs: z.number().int().positive().optional(),
    maxOutputBytes: z.number().int().positive().optional(),
    maxFileWrites: z.number().int().nonnegative().optional(),
    maxNetworkRequests: z.number().int().nonnegative().optional()
  })
  .strict();

export type ResourceLimits = z.infer<typeof resourceLimitsSchema>;
