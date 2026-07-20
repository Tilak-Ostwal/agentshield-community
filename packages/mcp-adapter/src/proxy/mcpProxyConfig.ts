import { z } from "zod";

export const mcpProxyConfigSchema = z
  .object({
    policyPath: z.string().min(1).optional(),
    evidencePath: z.string().min(1).optional(),
    registryPath: z.string().min(1).optional(),
    mode: z.enum(["mock", "stdio", "controlled_stdio"]).default("mock"),
    maxMessageBytes: z.number().int().positive().default(1024 * 1024),
    allowMethods: z.array(z.string().min(1)).default(["initialize", "initialized", "ping", "tools/list", "tools/call"])
  })
  .strict();

export type McpProxyConfig = z.infer<typeof mcpProxyConfigSchema>;

export function parseMcpProxyConfig(input: unknown): McpProxyConfig {
  return mcpProxyConfigSchema.parse(input ?? {});
}
