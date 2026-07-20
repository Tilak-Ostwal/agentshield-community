import { CAPABILITIES, type Capability, type CapabilityInferenceInput } from "./capabilityTypes.js";

const capabilitySet = new Set<string>(CAPABILITIES);
const secretKeys = ["token", "apikey", "api_key", "password", "secret", "authorization", "cookie"];

function add(target: Set<Capability>, capability: Capability): void {
  target.add(capability);
}

function objectInput(input: unknown): Record<string, unknown> {
  return typeof input === "object" && input !== null ? (input as Record<string, unknown>) : {};
}

function inputKeys(value: unknown): string[] {
  if (typeof value !== "object" || value === null) {
    return [];
  }
  if (Array.isArray(value)) {
    return value.flatMap(inputKeys);
  }
  return Object.entries(value as Record<string, unknown>).flatMap(([key, child]) => [key, ...inputKeys(child)]);
}

function hasSecretValue(value: unknown): boolean {
  if (typeof value === "string") {
    return /\bsk-[A-Za-z0-9-]{8,}\b/i.test(value);
  }
  if (Array.isArray(value)) {
    return value.some(hasSecretValue);
  }
  if (typeof value === "object" && value !== null) {
    return Object.values(value as Record<string, unknown>).some(hasSecretValue);
  }
  return false;
}

function declaredCapabilities(metadata: Record<string, unknown> | undefined): Capability[] {
  const tool = metadata?.tool;
  const raw = typeof tool === "object" && tool !== null ? (tool as Record<string, unknown>).capabilities : undefined;
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw.filter((candidate): candidate is Capability => typeof candidate === "string" && capabilitySet.has(candidate));
}

export function inferCapabilities(input: CapabilityInferenceInput): Capability[] {
  const capabilities = new Set<Capability>(declaredCapabilities(input.metadata));
  const toolName = input.toolName ?? "";
  const lowerTool = toolName.toLowerCase();
  const actionInput = objectInput(input.input);
  const keys = inputKeys(actionInput).map((key) => key.toLowerCase());

  if (lowerTool === "filesystem.read") add(capabilities, "filesystem.read");
  if (lowerTool === "filesystem.write") add(capabilities, "filesystem.write");
  if (lowerTool.includes("delete") || lowerTool === "filesystem.delete") add(capabilities, "filesystem.delete");
  if (lowerTool === "shell.exec") {
    add(capabilities, "shell.exec");
    add(capabilities, "code_execution");
  }
  if (lowerTool === "network.post" || lowerTool.includes("http.post")) {
    add(capabilities, "network.write");
    add(capabilities, "network.exfiltration_risk");
    add(capabilities, "external_side_effect");
  }
  if (lowerTool.includes("npm.install") || lowerTool.includes("package.install")) {
    add(capabilities, "package.install");
    add(capabilities, "network.read");
    add(capabilities, "filesystem.write");
    add(capabilities, "code_execution");
  }
  if (lowerTool === "git.push") {
    add(capabilities, "git.write");
    add(capabilities, "network.write");
    add(capabilities, "external_side_effect");
  }
  if (lowerTool === "browser.goto") {
    add(capabilities, "browser.write");
    add(capabilities, "network.read");
    add(capabilities, "untrusted_input_source");
  }

  if (typeof actionInput.url === "string") add(capabilities, "network.write");
  if (typeof actionInput.command === "string") add(capabilities, "code_execution");
  if (keys.some((key) => secretKeys.some((secretKey) => key.includes(secretKey))) || hasSecretValue(input.input)) {
    add(capabilities, "secret.read");
  }
  if (typeof actionInput.path === "string" && actionInput.path.toLowerCase().includes(".env")) {
    add(capabilities, "env.read");
    add(capabilities, "secret.read");
  }

  return [...capabilities].sort();
}
