import { z } from "zod";

import { registryEntrySchema, type RegistryEntry } from "./registryEntry.js";

export const registryFileSchema = z.object({
  version: z.literal(1),
  name: z.string().min(1),
  generatedAt: z.string().min(1),
  entries: z.array(registryEntrySchema)
}).strict();

export type RegistryFile = z.infer<typeof registryFileSchema>;

export function parseRegistryFile(input: unknown): RegistryFile {
  return registryFileSchema.parse(input);
}

export function defineRegistryFile(entries: RegistryEntry[]): RegistryFile {
  return {
    version: 1,
    name: "local-agent-tool-registry",
    generatedAt: "2026-06-26T00:00:00.000Z",
    entries
  };
}
