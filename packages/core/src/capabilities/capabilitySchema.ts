import { z } from "zod";

import { CAPABILITIES } from "./capabilityTypes.js";

export const capabilitySchema = z.enum(CAPABILITIES);

export const resourceScopeSchema = z
  .object({
    type: z.enum(["filesystem", "network", "secret", "env", "git", "browser", "database"]),
    allow: z.array(z.string()).optional(),
    deny: z.array(z.string()).optional()
  })
  .strict();

export const toolCapabilityDeclarationSchema = z
  .object({
    toolName: z.string().min(1),
    serverName: z.string().min(1).optional(),
    declaredCapabilities: z.array(capabilitySchema),
    resourceScopes: z.array(resourceScopeSchema).optional(),
    sideEffects: z.enum(["none", "local_read", "local_write", "external_write", "code_execution"]),
    riskLevel: z.enum(["low", "medium", "high", "critical"])
  })
  .strict();
