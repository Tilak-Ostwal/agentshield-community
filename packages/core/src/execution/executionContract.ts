import { createHash } from "node:crypto";
import { z } from "zod";

import type { ActionEnvelope } from "../action/actionEnvelope.js";
import { canonicalJson } from "../evidence/canonicalJson.js";
import { redactSecrets } from "../redaction/redactor.js";
import type { ResourceScope, SideEffect } from "./sideEffectTypes.js";

export const executionContractSchema = z
  .object({
    version: z.literal(1),
    contractId: z.string().min(1),
    actionId: z.string().min(1),
    actionHash: z.string().min(1),
    toolName: z.string().min(1),
    serverName: z.string().optional(),
    decision: z.enum(["allow", "require_human_review"]),
    approvedByTokenId: z.string().optional(),
    allowedSideEffects: z.array(z.string()),
    forbiddenSideEffects: z.array(z.string()),
    resourceScopes: z.array(z.object({ type: z.string(), allow: z.array(z.string()).optional(), deny: z.array(z.string()).optional() })).optional(),
    dryRunSupported: z.boolean(),
    reversible: z.boolean(),
    maxResponseBytes: z.number().int().positive().optional(),
    expiresAt: z.string().datetime().optional(),
    reason: z.string(),
    sandboxProfileId: z.string().optional()
  })
  .strict();

export type ExecutionContract = Omit<z.infer<typeof executionContractSchema>, "allowedSideEffects" | "forbiddenSideEffects" | "resourceScopes"> & {
  allowedSideEffects: SideEffect[];
  forbiddenSideEffects: SideEffect[];
  resourceScopes?: ResourceScope[];
};

export interface CreateExecutionContractInput {
  action: ActionEnvelope;
  actionHash: string;
  decision: "allow" | "require_human_review";
  allowedSideEffects: SideEffect[];
  forbiddenSideEffects?: SideEffect[];
  serverName?: string;
  approvedByTokenId?: string;
  resourceScopes?: ResourceScope[];
  dryRunSupported?: boolean;
  reversible?: boolean;
  maxResponseBytes?: number;
  expiresAt?: string;
  reason: string;
  sandboxProfileId?: string;
}

export function createExecutionContract(input: CreateExecutionContractInput): ExecutionContract {
  const contractSeed = canonicalJson(
    redactSecrets({
      actionId: input.action.actionId,
      actionHash: input.actionHash,
      toolName: input.action.toolName ?? input.action.actionType,
      serverName: input.serverName,
      decision: input.decision,
      allowedSideEffects: input.allowedSideEffects,
      resourceScopes: input.resourceScopes,
      reason: input.reason
    }).value
  );

  return {
    version: 1,
    contractId: `execution_contract_${createHash("sha256").update(contractSeed).digest("hex").slice(0, 24)}`,
    actionId: input.action.actionId,
    actionHash: input.actionHash,
    toolName: input.action.toolName ?? input.action.actionType,
    ...(input.serverName === undefined ? {} : { serverName: input.serverName }),
    decision: input.decision,
    ...(input.approvedByTokenId === undefined ? {} : { approvedByTokenId: input.approvedByTokenId }),
    allowedSideEffects: [...input.allowedSideEffects].sort(),
    forbiddenSideEffects: [...(input.forbiddenSideEffects ?? [])].sort(),
    ...(input.resourceScopes === undefined ? {} : { resourceScopes: input.resourceScopes }),
    dryRunSupported: input.dryRunSupported ?? true,
    reversible: input.reversible ?? false,
    ...(input.maxResponseBytes === undefined ? {} : { maxResponseBytes: input.maxResponseBytes }),
    ...(input.expiresAt === undefined ? {} : { expiresAt: input.expiresAt }),
    reason: input.reason,
    ...(input.sandboxProfileId === undefined ? {} : { sandboxProfileId: input.sandboxProfileId })
  };
}
