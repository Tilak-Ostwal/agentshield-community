import { z } from "zod";

import { filesystemPolicySchema } from "./filesystemPolicy.js";
import { networkPolicySchema } from "./networkPolicy.js";
import { resourceLimitsSchema } from "./resourceLimits.js";

export const sandboxProfileSchema = z
  .object({
    version: z.literal(1),
    profileId: z.string().min(1),
    name: z.string().min(1),
    isolationLevel: z.enum(["none", "readonly", "write_limited", "network_blocked", "network_allowlisted", "dry_run_only", "blocked"]),
    filesystem: filesystemPolicySchema,
    network: networkPolicySchema,
    resourceLimits: resourceLimitsSchema,
    allowedSideEffects: z.array(z.string()),
    forbiddenSideEffects: z.array(z.string()),
    reason: z.string()
  })
  .strict();

export type SandboxProfile = z.infer<typeof sandboxProfileSchema>;
