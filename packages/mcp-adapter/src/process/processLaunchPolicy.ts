import { z } from "zod";

export const allowlistedCommandSchema = z
  .object({
    id: z.string().min(1),
    command: z.string().min(1),
    args: z.array(z.string()).optional(),
    cwd: z.string().min(1).optional(),
    envAllowlist: z.array(z.string()).optional(),
    maxRuntimeMs: z.number().int().positive(),
    maxMessageBytes: z.number().int().positive(),
    maxStderrBytes: z.number().int().nonnegative(),
    reason: z.string().min(1)
  })
  .strict();

export type AllowlistedCommand = z.infer<typeof allowlistedCommandSchema>;

export const processLaunchPolicySchema = z
  .object({
    version: z.literal(1),
    mode: z.enum(["mock", "controlled_stdio"]),
    allowlistedCommands: z.array(allowlistedCommandSchema),
    defaultTimeoutMs: z.number().int().positive(),
    denyShell: z.literal(true),
    denyNetworkByDefault: z.literal(true)
  })
  .strict();

export type ProcessLaunchPolicy = z.infer<typeof processLaunchPolicySchema>;

export function parseProcessLaunchPolicy(input: unknown): ProcessLaunchPolicy {
  return processLaunchPolicySchema.parse(input);
}

export function findAllowlistedCommand(policy: ProcessLaunchPolicy, commandId: string): AllowlistedCommand | undefined {
  return policy.allowlistedCommands.find((command) => command.id === commandId);
}
