import { checkPolicyCompatibility } from "./policyCompatibilityChecker.js";
import type { PolicyMigrationReport } from "./policyMigrationSchema.js";
import type { PolicyV2, PolicyV2Rule } from "../v2/policyV2Schema.js";
import { policySchema } from "../policySchema.js";
import { policyV2Schema } from "../v2/policyV2Schema.js";

export interface MigrationResult {
  report: PolicyMigrationReport;
  policyV2?: PolicyV2;
}

export function migratePolicy(input: unknown, sourcePolicyPath: string): MigrationResult {
  const compat = checkPolicyCompatibility(input);

  if (compat.status === "incompatible") {
    return {
      report: {
        version: 1,
        sourcePolicyPath,
        sourceVersion: compat.fromVersion,
        targetVersion: 2,
        status: "failed",
        warnings: compat.breakingChanges,
        changes: [],
        requiresManualReview: true
      }
    };
  }

  if (compat.status === "compatible") {
    return {
      report: {
        version: 1,
        sourcePolicyPath,
        sourceVersion: 2,
        targetVersion: 2,
        status: "not_required",
        warnings: [],
        changes: [],
        requiresManualReview: false
      },
      policyV2: policyV2Schema.parse(input)
    };
  }

  // Parse v1
  const v1Result = policySchema.safeParse(input);
  if (!v1Result.success) {
    return {
      report: {
        version: 1,
        sourcePolicyPath,
        sourceVersion: 1,
        targetVersion: 2,
        status: "failed",
        warnings: ["Policy v1 schema parsing failed."],
        changes: [],
        requiresManualReview: true
      }
    };
  }

  const v1 = v1Result.data;
  let requiresManualReview = false;
  const changes: PolicyMigrationReport["changes"] = [];

  let priority = 1000;
  const v2Rules: PolicyV2Rule[] = [];

  for (const rule of v1.rules) {
    const v2Rule: PolicyV2Rule = {
      id: rule.id,
      priority,
      match: rule.match as any,
      effect: rule.decision
    };

    if (rule.decision === "require_human_review") {
      v2Rule.requireApproval = { reason: "Migrated from Policy v1 require_human_review" };
      changes.push({
        type: "rule_converted",
        message: "Added requireApproval block for require_human_review effect.",
        ruleId: rule.id
      });
    }

    // Add manual review warning if capability matching was complex (just as an example condition)
    if (rule.match.capabilitiesAny || rule.match.capabilitiesAll) {
      requiresManualReview = true;
      changes.push({
        type: "manual_review_required",
        message: "Verify capability match conversion is correct.",
        ruleId: rule.id
      });
    }

    changes.push({
      type: "field_renamed",
      message: "Renamed decision to effect and assigned priority.",
      ruleId: rule.id
    });

    v2Rules.push(v2Rule);
    priority -= 10;
  }

  if (v1.defaultDecision !== "deny") {
    // Should never happen based on v1 schema, but just in case
    requiresManualReview = true;
    changes.push({
      type: "manual_review_required",
      message: "Default decision was not deny. V2 enforces deny default.",
      ruleId: "default"
    });
  }

  const policyV2: PolicyV2 = {
    version: 2,
    name: "Migrated Policy",
    mode: "strict", // Migrated policies start strict
    defaultDecision: "deny",
    rules: v2Rules
  };

  return {
    report: {
      version: 1,
      sourcePolicyPath,
      sourceVersion: 1,
      targetVersion: 2,
      status: "migrated",
      warnings: [],
      changes,
      requiresManualReview
    },
    policyV2
  };
}
