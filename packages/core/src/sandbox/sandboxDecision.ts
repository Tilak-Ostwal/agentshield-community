import type { ActionEnvelope } from "../action/actionEnvelope.js";
import type { SideEffect } from "../execution/sideEffectTypes.js";
import { inferSideEffects } from "../execution/sideEffectTypes.js";
import type { IsolationLevel } from "./isolationLevel.js";
import type { SandboxProfile } from "./sandboxProfile.js";

export type SandboxDecisionImpact = "none" | "require_human_review" | "deny" | "dry_run";

export interface SandboxDecision {
  required: boolean;
  profileId: string;
  isolationLevel: IsolationLevel;
  reason: string;
  constraints: {
    filesystem: SandboxProfile["filesystem"];
    network: SandboxProfile["network"];
    resourceLimits: SandboxProfile["resourceLimits"];
    allowedSideEffects: string[];
    forbiddenSideEffects: string[];
  };
  decisionImpact: SandboxDecisionImpact;
}

export interface EvaluateSandboxDecisionInput {
  action: ActionEnvelope;
  capabilities?: string[];
  sideEffects?: SideEffect[];
  taintLabels?: string[];
  riskMarkers?: unknown[];
  approved?: boolean;
}

function profile(input: {
  id: string;
  name: string;
  level: IsolationLevel;
  reason: string;
  allowed: string[];
  forbidden?: string[];
  impact?: SandboxDecisionImpact;
  readonly?: boolean;
  allowWrite?: string[];
  networkMode?: "blocked" | "allowlist" | "open";
  allowDomains?: string[];
  limits?: SandboxProfile["resourceLimits"];
}): SandboxDecision {
  const sandboxProfile: SandboxProfile = {
    version: 1,
    profileId: input.id,
    name: input.name,
    isolationLevel: input.level,
    filesystem: {
      readonly: input.readonly ?? true,
      allowRead: ["/mock/project/**"],
      ...(input.allowWrite === undefined ? {} : { allowWrite: input.allowWrite }),
      deny: ["/.env", "/etc/**"]
    },
    network: {
      mode: input.networkMode ?? "blocked",
      ...(input.allowDomains === undefined ? {} : { allowDomains: input.allowDomains })
    },
    resourceLimits: input.limits ?? { maxExecutionMs: 1000, maxOutputBytes: 4096, maxFileWrites: 0, maxNetworkRequests: 0 },
    allowedSideEffects: input.allowed,
    forbiddenSideEffects: input.forbidden ?? [],
    reason: input.reason
  };

  return {
    required: input.level !== "none",
    profileId: sandboxProfile.profileId,
    isolationLevel: sandboxProfile.isolationLevel,
    reason: sandboxProfile.reason,
    constraints: {
      filesystem: sandboxProfile.filesystem,
      network: sandboxProfile.network,
      resourceLimits: sandboxProfile.resourceLimits,
      allowedSideEffects: sandboxProfile.allowedSideEffects,
      forbiddenSideEffects: sandboxProfile.forbiddenSideEffects
    },
    decisionImpact: input.impact ?? "none"
  };
}

export function evaluateSandboxDecision(input: EvaluateSandboxDecisionInput): SandboxDecision {
  const effects =
    input.sideEffects ??
    inferSideEffects({
      action: input.action,
      ...(input.capabilities === undefined ? {} : { capabilities: input.capabilities }),
      ...(input.taintLabels === undefined ? {} : { taintLabels: input.taintLabels })
    });
  const has = (effect: SideEffect) => effects.includes(effect);
  const taintedSecret = (input.taintLabels ?? []).some((label) => ["secret", "credential", "token"].includes(label));

  if (taintedSecret && has("network_write")) {
    return profile({
      id: "sandbox_block_secret_network",
      name: "Blocked Secret Network Sandbox",
      level: "blocked",
      reason: "secret or credential taint cannot be sent over network",
      allowed: [],
      forbidden: effects,
      impact: "deny"
    });
  }

  if (has("package_install")) {
    return profile({ id: "sandbox_block_package_install", name: "Blocked Package Install Sandbox", level: "blocked", reason: "package installation is blocked by default", allowed: [], forbidden: effects, impact: "deny" });
  }

  if (has("code_execution")) {
    return profile({
      id: input.approved === true ? "sandbox_dry_run_code_execution_approved" : "sandbox_dry_run_code_execution",
      name: "Dry Run Code Execution Sandbox",
      level: "dry_run_only",
      reason: "code execution is dry-run only in Phase 21",
      allowed: effects,
      impact: "dry_run"
    });
  }

  if (has("network_write") || has("external_side_effect")) {
    return profile({
      id: "sandbox_network_allowlisted",
      name: "Network Allowlisted Sandbox",
      level: "network_allowlisted",
      reason: "network side effects require allowlisted network isolation",
      allowed: effects,
      networkMode: "allowlist",
      allowDomains: ["example.invalid"],
      limits: { maxExecutionMs: 1000, maxOutputBytes: 4096, maxNetworkRequests: 1 }
    });
  }

  if (has("database_write")) {
    return profile({ id: "sandbox_database_write_review", name: "Database Write Review Sandbox", level: "write_limited", reason: "database writes require review or blocking", allowed: effects, impact: "require_human_review", readonly: false });
  }

  if (has("local_write")) {
    return profile({
      id: "sandbox_write_limited",
      name: "Write Limited Sandbox",
      level: "write_limited",
      reason: "filesystem writes require write-limited isolation",
      allowed: effects,
      readonly: false,
      allowWrite: ["/mock/project/**"],
      limits: { maxExecutionMs: 1000, maxOutputBytes: 4096, maxFileWrites: 1, maxNetworkRequests: 0 }
    });
  }

  if (has("local_read")) {
    return profile({ id: "sandbox_readonly", name: "Read Only Sandbox", level: "readonly", reason: "filesystem reads require readonly isolation", allowed: effects });
  }

  if (effects.length === 1 && effects[0] === "none") {
    return profile({ id: "sandbox_none", name: "No Sandbox", level: "none", reason: "no side effects inferred", allowed: ["none"], impact: "none" });
  }

  return profile({ id: "sandbox_unknown_blocked", name: "Unknown Side Effects Blocked", level: "blocked", reason: "unknown side effects fail closed", allowed: [], forbidden: effects, impact: "deny" });
}
