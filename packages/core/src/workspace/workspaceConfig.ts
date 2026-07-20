import { readFileSync } from "node:fs";

import { z } from "zod";

export const workspaceProfileSchema = z.enum(["strict", "balanced", "dev", "enterprise"]);

export const workspaceConfigSchema = z
  .object({
    version: z.literal(1),
    name: z.string().min(1),
    profile: workspaceProfileSchema,
    policyPack: z.string().min(1).optional(),
    policyPath: z.string().min(1).optional(),
    policyBundlePath: z.string().min(1).optional(),
    registryPath: z.string().min(1).optional(),
    registryBundlePath: z.string().min(1).optional(),
    sandbox: z
      .object({
        enabled: z.boolean(),
        defaultProfile: z.string().min(1)
      })
      .strict(),
    approval: z
      .object({
        enabled: z.boolean()
      })
      .strict(),
    evidence: z
      .object({
        enabled: z.boolean(),
        redactionRequired: z.literal(true)
      })
      .strict(),
    bench: z
      .object({
        profile: z.enum(["strict", "balanced", "audit", "dev"]),
        minimumScore: z.number().min(0).max(100),
        failOnCritical: z.boolean()
      })
      .strict(),
    ci: z
      .object({
        sarif: z.boolean(),
        markdown: z.boolean()
      })
      .strict(),
    adapters: z
      .object({
        mcp: z.boolean(),
        custom: z.boolean(),
        conformanceRequired: z.boolean()
      })
      .strict(),
    auditor: z
      .object({
        enabled: z.boolean().optional(),
        evidencePackPath: z.string().optional(),
        includePolicyBundle: z.boolean().optional(),
        includeRegistryBundle: z.boolean().optional()
      })
      .strict()
      .optional(),
    recipe: z.string().optional(),
    ide: z
      .object({
        vscode: z
          .object({
            enabled: z.boolean(),
            configPath: z.string().optional()
          })
          .strict()
      })
      .strict()
      .optional()
  })
  .strict();

export type WorkspaceConfig = z.infer<typeof workspaceConfigSchema>;

export interface WorkspaceConfigParseResult {
  ok: boolean;
  config?: WorkspaceConfig;
  error?: string;
}

export const defaultWorkspaceConfig: WorkspaceConfig = {
  version: 1,
  name: "agentshield-example-workspace",
  profile: "strict",
  policyPack: "strict-mcp-local",
  policyPath: "examples/policies/strict.policy.json",
  registryPath: "examples/registry/agentshield.registry.json",
  sandbox: {
    enabled: true,
    defaultProfile: "locked-down"
  },
  approval: {
    enabled: true
  },
  evidence: {
    enabled: true,
    redactionRequired: true
  },
  bench: {
    profile: "strict",
    minimumScore: 100,
    failOnCritical: true
  },
  ci: {
    sarif: true,
    markdown: true
  },
  adapters: {
    mcp: true,
    custom: true,
    conformanceRequired: true
  }
};

export function parseWorkspaceConfig(input: unknown): WorkspaceConfigParseResult {
  const result = workspaceConfigSchema.safeParse(input);

  if (!result.success) {
    return {
      ok: false,
      error: result.error.message
    };
  }

  return {
    ok: true,
    config: result.data
  };
}

export function renderWorkspaceConfigJson(config: WorkspaceConfig = defaultWorkspaceConfig): string {
  return `${JSON.stringify(config, null, 2)}\n`;
}

export function loadWorkspaceConfig(path: string): WorkspaceConfigParseResult {
  try {
    return parseWorkspaceConfig(JSON.parse(readFileSync(path, "utf8")) as unknown);
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown workspace config load error";
    return {
      ok: false,
      error: message
    };
  }
}
