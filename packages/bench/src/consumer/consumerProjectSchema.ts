import { z } from "zod";

export const ConsumerProjectSchema = z.object({
  version: z.literal(1),
  projectId: z.string(),
  name: z.string(),
  projectType: z.string(),
  workspaceConfigPath: z.string(),
  policyPath: z.string(),
  registryPath: z.string(),
  policyBundlePath: z.string(),
  registryBundlePath: z.string(),
  providerFixtures: z.array(z.string()),
  frameworkWorkflows: z.array(z.string()),
  multiAgentWorkflows: z.array(z.string()),
  requiredChecks: z.record(z.boolean())
});

export type ConsumerProjectConfig = z.infer<typeof ConsumerProjectSchema>;
