import type { ActionEnvelope } from "../action/actionEnvelope.js";
import type { ApprovalToken } from "../approval/approvalTypes.js";
import type { ExecutionContract } from "./executionContract.js";
import { inferSideEffects, resourceMatchesScopes, type SideEffect } from "./sideEffectTypes.js";

export type ExecutionPreflightStatus = "not_applicable" | "passed" | "failed" | "dry_run";

export interface PreflightVerificationInput {
  action: ActionEnvelope;
  contract: ExecutionContract;
  now: Date;
  capabilities?: string[];
  registryCapabilities?: string[];
  taintLabels?: string[];
  approvalToken?: ApprovalToken;
  dryRun?: boolean;
}

export interface PreflightVerificationResult {
  status: ExecutionPreflightStatus;
  ok: boolean;
  reason: string;
  inferredSideEffects: SideEffect[];
  violations: string[];
}

function subset(values: SideEffect[], allowed: SideEffect[]): boolean {
  return values.every((value) => allowed.includes(value));
}

export function verifyExecutionPreflight(input: PreflightVerificationInput): PreflightVerificationResult {
  const inferredSideEffects = inferSideEffects({
    action: input.action,
    ...(input.capabilities === undefined ? {} : { capabilities: input.capabilities }),
    ...(input.registryCapabilities === undefined ? {} : { registryCapabilities: input.registryCapabilities }),
    ...(input.taintLabels === undefined ? {} : { taintLabels: input.taintLabels })
  });
  const violations: string[] = [];

  if (input.contract.actionId !== input.action.actionId || input.contract.actionHash.length === 0) violations.push("contract action binding is invalid");
  if (input.approvalToken !== undefined && input.approvalToken.actionHash !== input.contract.actionHash) violations.push("approval token action hash mismatch");
  if (input.contract.expiresAt !== undefined && Date.parse(input.contract.expiresAt) <= input.now.getTime()) violations.push("execution contract expired");
  if (!subset(inferredSideEffects, input.contract.allowedSideEffects)) violations.push("inferred side effects exceed contract");
  if (inferredSideEffects.some((effect) => input.contract.forbiddenSideEffects.includes(effect))) violations.push("inferred side effects include forbidden effect");
  if (!resourceMatchesScopes(input.action, input.contract.resourceScopes)) violations.push("resource scope mismatch");

  if (violations.length > 0) {
    return { status: "failed", ok: false, reason: violations.join("; "), inferredSideEffects, violations };
  }

  return {
    status: input.dryRun === true ? "dry_run" : "passed",
    ok: true,
    reason: input.dryRun === true ? "execution dry-run preflight passed" : "execution preflight passed",
    inferredSideEffects,
    violations
  };
}
