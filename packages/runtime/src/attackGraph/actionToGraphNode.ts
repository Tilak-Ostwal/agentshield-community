import type { ActionEnvelope } from "@agentshield/core";

import type { AttackGraphActionContext, AttackGraphNode } from "./attackGraphTypes.js";

const SECRET_KEY_PARTS = ["password", "token", "apikey", "api_key", "secret", "authorization", "cookie"];
const SENSITIVE_PATH_PARTS = [".env", "id_rsa", "credentials", "token", "secret"];

function inputRecord(action: ActionEnvelope): Record<string, unknown> {
  return typeof action.input === "object" && action.input !== null ? (action.input as Record<string, unknown>) : {};
}

function collectKeys(value: unknown, prefix = ""): string[] {
  if (typeof value !== "object" || value === null) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item, index) => collectKeys(item, `${prefix}${index}.`));
  }

  return Object.entries(value as Record<string, unknown>).flatMap(([key, child]) => [
    `${prefix}${key}`,
    ...collectKeys(child, `${prefix}${key}.`)
  ]);
}

function hasSecretLookingValue(value: unknown): boolean {
  if (typeof value === "string") {
    return /\bsk-[A-Za-z0-9-]{8,}\b/.test(value) || /\b(?:token|secret|password)\s*[:=]/i.test(value);
  }

  if (Array.isArray(value)) {
    return value.some((item) => hasSecretLookingValue(item));
  }

  if (typeof value === "object" && value !== null) {
    return Object.values(value as Record<string, unknown>).some((child) => hasSecretLookingValue(child));
  }

  return false;
}

function hasSecretLookingKey(keys: string[]): boolean {
  return keys.some((key) => SECRET_KEY_PARTS.some((part) => key.toLowerCase().includes(part)));
}

function resourceFor(action: ActionEnvelope): string | undefined {
  const input = inputRecord(action);

  if (typeof input.path === "string" && input.path.length > 0) {
    return input.path;
  }

  if (typeof input.url === "string" && input.url.length > 0) {
    return input.url;
  }

  return undefined;
}

function operationFor(action: ActionEnvelope): string {
  if (typeof action.toolName === "string" && action.toolName.includes(".")) {
    return action.toolName.split(".").at(-1) ?? action.actionType;
  }

  return action.actionType;
}

function isSensitivePath(resource: string | undefined): boolean {
  if (resource === undefined) {
    return false;
  }

  const normalized = resource.toLowerCase();
  return SENSITIVE_PATH_PARTS.some((part) => normalized.includes(part));
}

export function actionToGraphNode(
  action: ActionEnvelope,
  nodeId: string,
  context: AttackGraphActionContext
): AttackGraphNode {
  const input = inputRecord(action);
  const inputKeys = collectKeys(input);
  const resource = resourceFor(action);
  const riskHints: string[] = [];

  if (hasSecretLookingKey(inputKeys)) {
    riskHints.push("secret_key");
  }

  if (hasSecretLookingValue(input)) {
    riskHints.push("secret_value");
  }

  if (isSensitivePath(resource)) {
    riskHints.push("sensitive_path");
  }

  if (context.fingerprintChanged) {
    riskHints.push("fingerprint_changed");
  }

  if (action.llmAdvisory?.decision === "allow" && context.policyDecision === "deny") {
    riskHints.push("llm_allow_policy_deny");
  }

  return {
    nodeId,
    actionId: action.actionId,
    timestamp: action.timestamp,
    actionType: action.actionType,
    ...(action.toolName === undefined ? {} : { toolName: action.toolName }),
    operation: operationFor(action),
    ...(resource === undefined ? {} : { resource }),
    inputKeys,
    outputKeys: [],
    riskHints,
    capabilities: [...(context.capabilities ?? [])],
    taintLabels: [...(context.taintLabels ?? [])]
  };
}
