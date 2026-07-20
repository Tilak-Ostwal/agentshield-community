import { createHash } from "node:crypto";
import { z } from "zod";

export const toolFingerprintSchema = z
  .object({
    toolName: z.string().min(1),
    serverName: z.string().min(1),
    schemaHash: z.string().min(1),
    descriptionHash: z.string().min(1),
    capabilities: z.array(z.string().min(1))
  })
  .strict();

export type ToolFingerprint = z.infer<typeof toolFingerprintSchema>;

function canonicalize(input: unknown): unknown {
  if (Array.isArray(input)) {
    return input.map((item) => canonicalize(item));
  }

  if (typeof input === "object" && input !== null && Object.getPrototypeOf(input) === Object.prototype) {
    return Object.fromEntries(
      Object.entries(input)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, value]) => [key, canonicalize(value)])
    );
  }

  return input;
}

export function stableHash(input: unknown): string {
  return createHash("sha256").update(JSON.stringify(canonicalize(input))).digest("hex");
}

export function createToolFingerprint(input: {
  toolName: string;
  serverName: string;
  schema: unknown;
  description: string;
  capabilities: string[];
}): ToolFingerprint {
  return toolFingerprintSchema.parse({
    toolName: input.toolName,
    serverName: input.serverName,
    schemaHash: stableHash(input.schema),
    descriptionHash: stableHash(input.description),
    capabilities: [...input.capabilities].sort()
  });
}

export function hasFingerprintChanged(previous: ToolFingerprint, current: ToolFingerprint): boolean {
  return (
    previous.toolName !== current.toolName ||
    previous.serverName !== current.serverName ||
    previous.schemaHash !== current.schemaHash ||
    previous.descriptionHash !== current.descriptionHash ||
    previous.capabilities.length !== current.capabilities.length ||
    previous.capabilities.some((capability, index) => capability !== current.capabilities[index])
  );
}
