import { z } from "zod";

export const frameworkToolSchema = z.object({
  version: z.literal(1),
  toolId: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1),
  capabilities: z.array(z.string()).optional(),
  sideEffects: z.array(z.string()).optional(),
  inputSchema: z.record(z.unknown()).optional(),
  metadata: z.record(z.unknown()).optional()
}).strict();

export type FrameworkTool = z.infer<typeof frameworkToolSchema>;

export const frameworkToolRegistrySchema = z.array(frameworkToolSchema);

export type FrameworkToolRegistry = z.infer<typeof frameworkToolRegistrySchema>;

export function parseFrameworkToolRegistry(input: unknown): FrameworkToolRegistry {
  return frameworkToolRegistrySchema.parse(input);
}
