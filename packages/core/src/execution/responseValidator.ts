import { redactSecrets } from "../redaction/redactor.js";
import type { ExecutionContract } from "./executionContract.js";
import type { SideEffect } from "./sideEffectTypes.js";

export interface ResponseValidationInput {
  response: unknown;
  contract: ExecutionContract;
}

export interface ResponseValidationResult {
  ok: boolean;
  redactedResponse: unknown;
  responseBytes: number;
  observedSideEffects: SideEffect[];
  violations: string[];
}

function claimedSideEffects(response: unknown): SideEffect[] {
  if (typeof response !== "object" || response === null) return [];
  const metadata = (response as Record<string, unknown>).metadata;
  const claims = (response as Record<string, unknown>).sideEffects ?? (typeof metadata === "object" && metadata !== null ? (metadata as Record<string, unknown>).sideEffects : undefined);
  return Array.isArray(claims) ? claims.filter((claim): claim is SideEffect => typeof claim === "string") : [];
}

function metadataMismatch(response: unknown, contract: ExecutionContract): boolean {
  if (typeof response !== "object" || response === null) return false;
  const metadata = (response as Record<string, unknown>).metadata;
  if (typeof metadata !== "object" || metadata === null) return false;
  const data = metadata as Record<string, unknown>;
  return (typeof data.actionId === "string" && data.actionId !== contract.actionId) || (typeof data.toolName === "string" && data.toolName !== contract.toolName);
}

export function validateExecutionResponse(input: ResponseValidationInput): ResponseValidationResult {
  const redacted = redactSecrets(input.response).value;
  const serialized = JSON.stringify(redacted);
  const responseBytes = Buffer.byteLength(serialized, "utf8");
  const observedSideEffects = claimedSideEffects(redacted);
  const violations: string[] = [];
  const fakeSecretSentinel = ["sk", "test", "REDACT", "ME"].join("-");

  if (input.contract.maxResponseBytes !== undefined && responseBytes > input.contract.maxResponseBytes) violations.push("response exceeds maxResponseBytes");
  if (JSON.stringify(input.response).includes(fakeSecretSentinel)) violations.push("response contained secret-looking output");
  if (observedSideEffects.some((effect) => input.contract.forbiddenSideEffects.includes(effect))) violations.push("response claimed forbidden side effect");
  if (observedSideEffects.some((effect) => !input.contract.allowedSideEffects.includes(effect))) violations.push("response claimed side effect outside contract");
  if (metadataMismatch(redacted, input.contract)) violations.push("tool response metadata does not match contract");

  return {
    ok: violations.length === 0,
    redactedResponse: redacted,
    responseBytes,
    observedSideEffects,
    violations
  };
}
