import { z } from "zod";

export const sdkConfigSchema = z
  .object({
    policyPath: z.string().min(1).optional(),
    registryPath: z.string().min(1).optional(),
    evidence: z.boolean().optional(),
    sandbox: z.boolean().optional(),
    execution: z.boolean().optional(),
    approval: z
      .object({
        enabled: z.boolean(),
        signingKey: z.string().min(1).optional()
      })
      .strict()
      .optional(),
    redaction: z
      .object({
        enabled: z.boolean()
      })
      .strict()
      .optional(),
    mode: z.enum(["strict", "balanced", "dev"]).optional()
  })
  .strict();

export type AgentShieldSdkConfig = z.infer<typeof sdkConfigSchema>;

export function parseSdkConfig(input: unknown): AgentShieldSdkConfig {
  return sdkConfigSchema.parse(input ?? {});
}

export function defaultDenyPolicy(): unknown {
  return {
    version: 1,
    defaultDecision: "deny",
    rules: []
  };
}
