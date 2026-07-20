export const CAPABILITIES = [
  "filesystem.read",
  "filesystem.write",
  "filesystem.delete",
  "shell.exec",
  "network.read",
  "network.write",
  "network.exfiltration_risk",
  "secret.read",
  "secret.write",
  "env.read",
  "package.install",
  "git.read",
  "git.write",
  "browser.read",
  "browser.write",
  "database.read",
  "database.write",
  "external_side_effect",
  "code_execution",
  "untrusted_input_source"
] as const;

export type Capability = (typeof CAPABILITIES)[number];
export type CapabilityRiskLevel = "low" | "medium" | "high" | "critical";
export type SideEffectLevel = "none" | "local_read" | "local_write" | "external_write" | "code_execution";

export interface ResourceScope {
  type: "filesystem" | "network" | "secret" | "env" | "git" | "browser" | "database";
  allow?: string[];
  deny?: string[];
}

export interface ToolCapabilityDeclaration {
  toolName: string;
  serverName?: string;
  declaredCapabilities: Capability[];
  resourceScopes?: ResourceScope[];
  sideEffects: SideEffectLevel;
  riskLevel: CapabilityRiskLevel;
}

export interface CapabilityInferenceInput {
  actionType: string;
  toolName?: string;
  input?: unknown;
  metadata?: Record<string, unknown>;
}
