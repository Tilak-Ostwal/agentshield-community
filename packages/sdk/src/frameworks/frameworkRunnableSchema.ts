import { z } from "zod";

export const frameworkRunnableSchema = z.object({
  version: z.literal(1),
  runnableId: z.string().min(1),
  toolName: z.string().min(1),
  input: z.record(z.unknown()).optional(),
  metadata: z.record(z.unknown()).optional()
}).strict();

export type FrameworkRunnable = z.infer<typeof frameworkRunnableSchema>;

export function parseFrameworkRunnable(input: unknown): FrameworkRunnable {
  return frameworkRunnableSchema.parse(input);
}
