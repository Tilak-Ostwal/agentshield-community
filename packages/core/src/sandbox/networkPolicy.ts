import { z } from "zod";

export const networkPolicySchema = z
  .object({
    mode: z.enum(["blocked", "allowlist", "open"]),
    allowDomains: z.array(z.string()).optional(),
    denyDomains: z.array(z.string()).optional()
  })
  .strict();

export type NetworkPolicy = z.infer<typeof networkPolicySchema>;
