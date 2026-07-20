import { redactSecrets } from "../../redaction/redactor.js";
import { AgentShieldSecurityError } from "../../shared/securityError.js";
import { policySchema, type Policy, type PolicyDecision } from "../policySchema.js";
import type { PolicyV2, PolicyV2Rule } from "../v2/policyV2Schema.js";
import { policyV2Schema } from "../v2/policyV2Schema.js";

export interface PolicyMigrationDiagnostic {
  readonly severity: "error" | "warning";
  readonly code: "POLICY_V1_SCHEMA_INVALID" | "POLICY_V2_SCHEMA_INVALID" | "POLICY_V1_EMPTY_RULES";
  readonly message: string;
}

export interface PolicyCompatibilityResult {
  readonly ok: boolean;
  readonly diagnostics: readonly PolicyMigrationDiagnostic[];
}

function sanitizeDiagnostics(diagnostics: readonly PolicyMigrationDiagnostic[]): readonly PolicyMigrationDiagnostic[] {
  return redactSecrets(diagnostics).value;
}

function toV2Effect(decision: PolicyDecision): PolicyV2Rule["effect"] {
  return decision;
}

function migrateRule(rule: Policy["rules"][number], index: number): PolicyV2Rule {
  const base = {
    id: rule.id,
    effect: toV2Effect(rule.decision),
    priority: index,
    match: {
      ...(rule.match.actionType === undefined ? {} : { actionType: "tool_call" as const }),
      ...(rule.match.toolName === undefined ? {} : { toolName: rule.match.toolName }),
      ...(rule.match.capability === undefined ? {} : { capability: rule.match.capability }),
      ...(rule.match.capabilitiesAny === undefined ? {} : { capabilitiesAny: rule.match.capabilitiesAny }),
      ...(rule.match.capabilitiesAll === undefined ? {} : { capabilitiesAll: rule.match.capabilitiesAll }),
      ...(rule.match.taintAny === undefined ? {} : { taintAny: rule.match.taintAny }),
      ...(rule.match.taintAll === undefined ? {} : { taintAll: rule.match.taintAll })
    }
  };

  if (rule.decision !== "require_human_review") {
    return base;
  }

  return {
    ...base,
    requireApproval: {
      reason: `migrated v1 review rule ${rule.id}`
    }
  };
}

export function checkPolicyV1Compatibility(input: unknown): PolicyCompatibilityResult {
  const parsed = policySchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      diagnostics: sanitizeDiagnostics([
        {
          severity: "error",
          code: "POLICY_V1_SCHEMA_INVALID",
          message: "policy v1 schema validation failed"
        }
      ])
    };
  }

  if (parsed.data.rules.length === 0) {
    return {
      ok: true,
      diagnostics: sanitizeDiagnostics([
        {
          severity: "warning",
          code: "POLICY_V1_EMPTY_RULES",
          message: "policy v1 has no explicit rules and will remain default-deny"
        }
      ])
    };
  }

  return {
    ok: true,
    diagnostics: []
  };
}

export function migratePolicyV1ToV2(input: unknown, name = "migrated-policy-v1"): PolicyV2 {
  const parsed = policySchema.safeParse(input);

  if (!parsed.success) {
    throw new AgentShieldSecurityError({
      code: "POLICY_MIGRATION_INVALID",
      message: "policy migration failed because v1 input is invalid"
    });
  }

  const migrated: PolicyV2 = {
    version: 2,
    name,
    defaultDecision: "deny",
    mode: "strict",
    rules: parsed.data.rules.map(migrateRule)
  };

  const verified = policyV2Schema.safeParse(migrated);

  if (!verified.success) {
    throw new AgentShieldSecurityError({
      code: "POLICY_MIGRATION_INVALID",
      message: "policy migration produced invalid v2 policy"
    });
  }

  return verified.data;
}
