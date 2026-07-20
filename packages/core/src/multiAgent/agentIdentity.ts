import { z } from "zod";
import { AgentRoleSchema, AgentTrustLevelSchema } from "./agentRole.js";

export const AgentIdentitySchema = z.object({
  version: z.literal(1),
  agentId: z.string().min(1),
  displayName: z.string().min(1),
  role: AgentRoleSchema,
  trustLevel: AgentTrustLevelSchema,
  allowedCapabilities: z.array(z.string()),
  deniedCapabilities: z.array(z.string()),
  metadata: z.record(z.string(), z.any()).optional()
});

export type AgentIdentity = z.infer<typeof AgentIdentitySchema>;

export function parseAgentIdentity(input: unknown): { valid: boolean; identity?: AgentIdentity; error?: string } {
  const parsed = AgentIdentitySchema.safeParse(input);
  if (!parsed.success) {
    return { valid: false, error: parsed.error.message };
  }
  return { valid: true, identity: parsed.data };
}
