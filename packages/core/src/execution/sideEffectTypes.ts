import type { ActionEnvelope } from "../action/actionEnvelope.js";
import type { Capability, ResourceScope } from "../capabilities/capabilityTypes.js";

export const SIDE_EFFECTS = [
  "none",
  "local_read",
  "local_write",
  "local_delete",
  "code_execution",
  "network_read",
  "network_write",
  "credential_access",
  "environment_access",
  "git_read",
  "git_write",
  "package_install",
  "browser_navigation",
  "browser_mutation",
  "database_read",
  "database_write",
  "external_side_effect"
] as const;

export type SideEffect = (typeof SIDE_EFFECTS)[number];
export type { ResourceScope };

export interface SideEffectInferenceInput {
  action: ActionEnvelope;
  capabilities?: string[];
  registryCapabilities?: string[];
  policyExplanation?: unknown;
  taintLabels?: string[];
  riskContext?: unknown;
}

const capabilityEffects: Partial<Record<Capability, SideEffect[]>> = {
  "filesystem.read": ["local_read"],
  "filesystem.write": ["local_write"],
  "filesystem.delete": ["local_delete"],
  "shell.exec": ["code_execution"],
  "network.read": ["network_read"],
  "network.write": ["network_write", "external_side_effect"],
  "network.exfiltration_risk": ["external_side_effect"],
  "secret.read": ["credential_access"],
  "env.read": ["environment_access", "credential_access"],
  "package.install": ["package_install", "network_read", "local_write", "code_execution"],
  "git.read": ["git_read"],
  "git.write": ["git_write", "network_write", "external_side_effect"],
  "browser.read": ["network_read"],
  "browser.write": ["browser_mutation"],
  "database.read": ["database_read"],
  "database.write": ["database_write"],
  external_side_effect: ["external_side_effect"],
  code_execution: ["code_execution"]
};

function add(target: Set<SideEffect>, effects: SideEffect[]): void {
  for (const effect of effects) target.add(effect);
}

function effectsFromTool(toolName: string | undefined): SideEffect[] {
  const tool = toolName?.toLowerCase() ?? "";
  if (tool === "filesystem.read") return ["local_read"];
  if (tool === "filesystem.write") return ["local_write"];
  if (tool === "filesystem.delete" || tool.includes("delete")) return ["local_delete"];
  if (tool === "shell.exec") return ["code_execution"];
  if (tool === "network.post" || tool.includes("http.post")) return ["network_write", "external_side_effect"];
  if (tool === "git.push") return ["git_write", "network_write", "external_side_effect"];
  if (tool.includes("package.install") || tool.includes("npm.install")) return ["package_install", "network_read", "local_write", "code_execution"];
  if (tool === "browser.goto") return ["browser_navigation", "network_read"];
  if (tool === "database.write") return ["database_write"];
  if (tool === "database.read") return ["database_read"];
  return [];
}

function hasSecretKey(value: unknown): boolean {
  if (Array.isArray(value)) return value.some(hasSecretKey);
  if (typeof value !== "object" || value === null) return false;
  return Object.entries(value as Record<string, unknown>).some(([key, child]) => {
    const lower = key.toLowerCase();
    return ["token", "secret", "password", "apikey", "api_key", "authorization", "cookie"].some((name) => lower.includes(name)) || hasSecretKey(child);
  });
}

export function inferSideEffects(input: SideEffectInferenceInput): SideEffect[] {
  const effects = new Set<SideEffect>();

  add(effects, effectsFromTool(input.action.toolName));

  for (const capability of [...(input.capabilities ?? []), ...(input.registryCapabilities ?? [])]) {
    const mapped = capabilityEffects[capability as Capability];
    if (mapped !== undefined) add(effects, mapped);
  }

  const actionInput = typeof input.action.input === "object" && input.action.input !== null ? (input.action.input as Record<string, unknown>) : {};
  if (typeof actionInput.url === "string") add(effects, ["network_write", "external_side_effect"]);
  if (typeof actionInput.command === "string") add(effects, ["code_execution"]);
  if (typeof actionInput.path === "string" && actionInput.path.toLowerCase().includes(".env")) add(effects, ["environment_access", "credential_access"]);
  if (hasSecretKey(input.action.input) || (input.taintLabels ?? []).some((label) => ["secret", "credential", "token"].includes(label))) add(effects, ["credential_access"]);

  return effects.size === 0 ? ["none"] : [...effects].sort();
}

function wildcardMatch(pattern: string, value: string): boolean {
  if (pattern.endsWith("/**")) return value.startsWith(pattern.slice(0, -3));
  if (pattern.endsWith("*")) return value.startsWith(pattern.slice(0, -1));
  return pattern === value;
}

export function resourceMatchesScopes(action: ActionEnvelope, scopes: ResourceScope[] | undefined): boolean {
  if (scopes === undefined || scopes.length === 0) return true;
  const input = typeof action.input === "object" && action.input !== null ? (action.input as Record<string, unknown>) : {};
  const resource = typeof input.path === "string" ? { type: "filesystem", value: input.path } : typeof input.url === "string" ? { type: "network", value: input.url } : undefined;
  if (resource === undefined) return true;
  const relevant = scopes.filter((scope) => scope.type === resource.type);
  if (relevant.length === 0) return false;
  return relevant.some((scope) => {
    if ((scope.deny ?? []).some((pattern) => wildcardMatch(pattern, resource.value))) return false;
    return scope.allow === undefined || scope.allow.some((pattern) => wildcardMatch(pattern, resource.value));
  });
}
