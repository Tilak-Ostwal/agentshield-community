import type { PolicyEvaluation } from "../policy/policyEvaluator.js";
import type { PolicyDecision } from "../policy/policySchema.js";
import type { ApprovalStatus, ApprovalTicket, ApprovalVerificationResult } from "./approvalTypes.js";

export interface ApprovalPolicyContext {
  currentEvaluation: PolicyEvaluation;
  ticket?: ApprovalTicket;
  verification?: ApprovalVerificationResult;
  invalidInput?: boolean;
  explicitPolicyDeny?: boolean;
  blockedRegistry?: boolean;
  criticalSecretExfiltration?: boolean;
  failClosed?: boolean;
}

export interface ApprovalPolicyResult {
  decision: PolicyDecision;
  approvalStatus: ApprovalStatus;
  ruleId: string;
  reason: string;
}

export function applyApprovalPolicy(context: ApprovalPolicyContext): ApprovalPolicyResult {
  const current = context.currentEvaluation;

  if (current.decision !== "require_human_review") {
    return {
      decision: current.decision,
      approvalStatus: "not_required",
      ruleId: current.ruleId,
      reason: current.reason
    };
  }

  if (context.invalidInput || context.explicitPolicyDeny || context.blockedRegistry || context.criticalSecretExfiltration || context.failClosed) {
    return {
      decision: "deny",
      approvalStatus: "invalid",
      ruleId: "approval-deny-precedence",
      reason: "approval cannot override deny-precedence condition"
    };
  }

  if (context.ticket === undefined || context.verification === undefined) {
    return {
      decision: "require_human_review",
      approvalStatus: "required",
      ruleId: current.ruleId,
      reason: current.reason
    };
  }

  if (context.verification.status === "expired") {
    return {
      decision: "require_human_review",
      approvalStatus: "expired",
      ruleId: "approval-expired",
      reason: context.verification.reason
    };
  }

  if (context.verification.status !== "valid" || context.verification.token === undefined) {
    return {
      decision: "require_human_review",
      approvalStatus: "invalid",
      ruleId: "approval-invalid",
      reason: context.verification?.reason ?? "approval token invalid"
    };
  }

  if (context.verification.token.approvedDecision === "deny") {
    return {
      decision: "deny",
      approvalStatus: "rejected",
      ruleId: "approval-rejected",
      reason: "human approval token denied the action"
    };
  }

  return {
    decision: "allow",
    approvalStatus: "approved",
    ruleId: "approval-approved",
    reason: "human approval token allowed the reviewed action"
  };
}
