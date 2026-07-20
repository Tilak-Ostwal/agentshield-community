import type { ActionEnvelope } from "../action/actionEnvelope.js";
import type { Capability } from "../capabilities/capabilityTypes.js";
import type { TaintLabel, TaintSinkAssessment, TaintSource } from "./taintTypes.js";

const secretKeyMap: Array<[string, TaintLabel[]]> = [
  ["apikey", ["secret", "api_key", "credential"]],
  ["api_key", ["secret", "api_key", "credential"]],
  ["password", ["secret", "password", "credential"]],
  ["token", ["secret", "token", "credential"]],
  ["authorization", ["secret", "credential"]],
  ["cookie", ["secret", "credential"]],
  ["secret", ["secret"]]
];

function inputRecord(action: ActionEnvelope): Record<string, unknown> {
  return typeof action.input === "object" && action.input !== null ? (action.input as Record<string, unknown>) : {};
}

function collectKeys(value: unknown): string[] {
  if (typeof value !== "object" || value === null) return [];
  if (Array.isArray(value)) return value.flatMap(collectKeys);
  return Object.entries(value as Record<string, unknown>).flatMap(([key, child]) => [key, ...collectKeys(child)]);
}

function hasSecretLookingValue(value: unknown): boolean {
  if (typeof value === "string") return /\bsk-[A-Za-z0-9-]{8,}\b/i.test(value);
  if (Array.isArray(value)) return value.some(hasSecretLookingValue);
  if (typeof value === "object" && value !== null) {
    return Object.values(value as Record<string, unknown>).some(hasSecretLookingValue);
  }
  return false;
}

function add(labels: Set<TaintLabel>, sources: TaintSource[], label: TaintLabel, reason: string, action: ActionEnvelope, resource?: string): void {
  if (!labels.has(label)) {
    labels.add(label);
    sources.push({ label, reason, actionId: action.actionId, ...(resource === undefined ? {} : { resource }) });
  }
}

export function resourceFromAction(action: ActionEnvelope): string | undefined {
  const input = inputRecord(action);
  if (typeof input.path === "string" && input.path.length > 0) return input.path;
  if (typeof input.url === "string" && input.url.length > 0) return input.url;
  return undefined;
}

export function detectTaintSources(action: ActionEnvelope, capabilities: Capability[] = []): TaintSource[] {
  const input = inputRecord(action);
  const resource = resourceFromAction(action);
  const lowerResource = resource?.toLowerCase() ?? "";
  const labels = new Set<TaintLabel>();
  const sources: TaintSource[] = [];

  for (const key of collectKeys(input).map((item) => item.toLowerCase())) {
    for (const [part, taints] of secretKeyMap) {
      if (key.includes(part)) {
        for (const label of taints) add(labels, sources, label, `input key ${key}`, action, resource);
      }
    }
  }

  if (hasSecretLookingValue(action.input)) {
    add(labels, sources, "secret", "secret-looking value", action, resource);
    add(labels, sources, "token", "secret-looking value", action, resource);
    add(labels, sources, "credential", "secret-looking value", action, resource);
  }

  if ([".env", "credentials", "secret", "token", "key"].some((part) => lowerResource.includes(part))) {
    add(labels, sources, "filesystem_sensitive", "sensitive-looking path", action, resource);
    add(labels, sources, "secret", "sensitive-looking path", action, resource);
  }
  if (lowerResource.includes(".env")) add(labels, sources, "env_secret", ".env path", action, resource);
  if (lowerResource.includes("id_rsa")) add(labels, sources, "ssh_key", "ssh key path", action, resource);

  if (capabilities.includes("secret.read")) add(labels, sources, "secret", "secret.read capability", action, resource);
  if (capabilities.includes("env.read")) add(labels, sources, "env_secret", "env.read capability", action, resource);
  if (capabilities.includes("browser.read") || action.toolName === "browser.goto") {
    add(labels, sources, "browser_untrusted", "browser content source", action, resource);
    add(labels, sources, "network_untrusted", "browser/network source", action, resource);
    add(labels, sources, "external_content", "browser/network source", action, resource);
    add(labels, sources, "prompt_injection_source", "browser/network source", action, resource);
  }
  if (capabilities.includes("network.read") || action.toolName === "network.get" || action.toolName === "email.read") {
    add(labels, sources, "network_untrusted", "network content source", action, resource);
    add(labels, sources, "external_content", "network content source", action, resource);
  }

  if (typeof input.code === "string" || typeof input.generatedCode === "string") {
    add(labels, sources, "generated_code", "generated code input", action, resource);
    add(labels, sources, "executable_content", "generated code input", action, resource);
  }
  if (typeof input.privateUserData === "string" || typeof input.email === "string") {
    add(labels, sources, "private_user_data", "private user data input", action, resource);
    add(labels, sources, "pii_possible", "private user data input", action, resource);
  }

  return sources;
}

export function assessTaintSink(labels: TaintLabel[], capabilities: Capability[]): TaintSinkAssessment {
  const observed = new Set(labels);
  const has = (label: TaintLabel) => observed.has(label);
  const sink =
    capabilities.includes("network.write") ||
    capabilities.includes("external_side_effect") ||
    capabilities.includes("shell.exec") ||
    capabilities.includes("code_execution") ||
    capabilities.includes("package.install") ||
    capabilities.includes("git.write") ||
    capabilities.includes("database.write") ||
    capabilities.includes("browser.write");

  if (!sink || labels.length === 0) return { isSink: false, severity: "none", reason: "no tainted sink", labels };

  if ((has("secret") || has("env_secret") || has("credential") || has("token") || has("api_key") || has("password")) && capabilities.some((capability) => capability === "network.write" || capability === "git.write")) {
    return { isSink: true, severity: "critical", recommendedDecision: "deny", reason: "sensitive taint to external write sink", labels };
  }
  if ((has("browser_untrusted") || has("network_untrusted") || has("generated_code") || has("executable_content")) && (capabilities.includes("shell.exec") || capabilities.includes("code_execution"))) {
    return { isSink: true, severity: "high", recommendedDecision: "require_human_review", reason: "untrusted or generated content to execution sink", labels };
  }
  if (has("private_user_data") && capabilities.includes("external_side_effect")) {
    return { isSink: true, severity: "high", recommendedDecision: "require_human_review", reason: "private data to external side effect", labels };
  }

  return { isSink: true, severity: "medium", recommendedDecision: "require_human_review", reason: "tainted data to sink", labels };
}
