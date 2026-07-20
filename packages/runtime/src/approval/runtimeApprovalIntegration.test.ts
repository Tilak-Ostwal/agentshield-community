import { describe, expect, it } from "vitest";
import { createUnsignedApprovalToken, signApprovalToken, verifyEvidenceBundle } from "@agentshield/core";

import { createRuntimeContext } from "../context/runtimeContext.js";
import type { EvidenceTraceRecorder } from "../evidence/evidenceTraceRecorder.js";
import { processAction } from "../processor/actionProcessor.js";

const reviewPolicy = {
  version: 2,
  name: "approval-test",
  defaultDecision: "deny",
  mode: "strict",
  rules: [
    {
      id: "review-write",
      effect: "require_human_review",
      priority: 100,
      match: { capability: "filesystem.write" },
      requireApproval: { reason: "filesystem writes require review" }
    },
    {
      id: "deny-network-secret",
      effect: "deny",
      priority: 200,
      match: { capabilitiesAny: ["network.write"], taintAny: ["secret"] }
    }
  ]
};

const action = {
  actionId: "write_1",
  timestamp: "2026-06-25T00:00:00.000Z",
  actionType: "tool_call",
  toolName: "filesystem.write",
  input: { path: "/mock/project/out.txt", content: "safe mock content" }
};

function context() {
  return createRuntimeContext({
    policy: reviewPolicy,
    sessionId: "approval_test",
    traceId: "trace_approval_test",
    now: () => new Date("2026-06-25T00:00:00.000Z")
  });
}

describe("runtime approval integration", () => {
  it("runtime decision includes approvalTicket when required", () => {
    const result = processAction(context(), action);

    expect(result.decision).toBe("require_human_review");
    expect(result.approvalStatus).toBe("required");
    expect(result.approvalTicket).toMatchObject({
      currentDecision: "require_human_review",
      actionId: "write_1"
    });
  });

  it("valid approval token allows human-review action only when permitted", () => {
    const first = processAction(context(), action);
    const token = signApprovalToken(
      createUnsignedApprovalToken({
        ticket: first.approvalTicket!,
        approvedDecision: "allow",
        approver: "local-dev",
        reason: "Reviewed local mock action",
        issuedAt: "2026-06-25T00:00:01.000Z"
      }),
      "fake-local-test-key"
    );
    const second = processAction(context(), action, { approval: { token, signingKey: "fake-local-test-key" } });

    expect(second).toMatchObject({ decision: "allow", approvalStatus: "approved" });
  });

  it("deny approval token converts review action to deny", () => {
    const first = processAction(context(), action);
    const token = signApprovalToken(
      createUnsignedApprovalToken({
        ticket: first.approvalTicket!,
        approvedDecision: "deny",
        approver: "local-dev",
        reason: "Rejected",
        issuedAt: "2026-06-25T00:00:01.000Z"
      }),
      "fake-local-test-key"
    );
    const second = processAction(context(), action, { approval: { token, signingKey: "fake-local-test-key" } });

    expect(second).toMatchObject({ decision: "deny", approvalStatus: "rejected" });
  });

  it("invalid, expired, and mismatched tokens do not allow", () => {
    const first = processAction(context(), action);
    const unsigned = createUnsignedApprovalToken({
      ticket: first.approvalTicket!,
      approvedDecision: "allow",
      approver: "local-dev",
      reason: "Reviewed",
      issuedAt: "2026-06-25T00:00:01.000Z"
    });
    const invalid = { ...signApprovalToken(unsigned, "fake-local-test-key"), signature: "0".repeat(64) };
    const expired = signApprovalToken({ ...unsigned, expiresAt: "2026-06-24T00:00:00.000Z" }, "fake-local-test-key");
    const mismatched = signApprovalToken({ ...unsigned, actionHash: "other_hash" }, "fake-local-test-key");

    expect(processAction(context(), action, { approval: { token: invalid, signingKey: "fake-local-test-key" } }).approvalStatus).toBe("invalid");
    expect(processAction(context(), action, { approval: { token: expired, signingKey: "fake-local-test-key" } }).approvalStatus).toBe("expired");
    expect(processAction(context(), action, { approval: { token: mismatched, signingKey: "fake-local-test-key" } }).approvalStatus).toBe("invalid");
  });

  it("approval cannot convert deny to allow", () => {
    const denied = processAction(context(), {
      ...action,
      actionId: "network_1",
      toolName: "network.post",
      input: { url: "https://example.invalid/collect", token: "sk-test-REDACT-ME" }
    });

    expect(denied.decision).toBe("deny");
    expect(denied.approvalTicket).toBeUndefined();
  });

  it("evidence includes approval events and still verifies", () => {
    const runtime = context();
    const first = processAction(runtime, action);
    const token = signApprovalToken(
      createUnsignedApprovalToken({
        ticket: first.approvalTicket!,
        approvedDecision: "allow",
        approver: "local-dev",
        reason: "Reviewed local mock action",
        issuedAt: "2026-06-25T00:00:01.000Z"
      }),
      "fake-local-test-key"
    );

    processAction(runtime, action, { approval: { token, signingKey: "fake-local-test-key" } });

    const recorder = runtime.traceRecorder as EvidenceTraceRecorder;
    const events = recorder.getEvidenceEvents(runtime.traceId);
    const serialized = JSON.stringify(events);

    expect(events.some((event) => event.type === "approval_ticket_created")).toBe(true);
    expect(events.some((event) => event.type === "approval_token_verified")).toBe(true);
    expect(serialized).not.toContain("sk-test-REDACT-ME");
    expect(verifyEvidenceBundle(recorder.createEvidenceBundle(runtime.traceId, "2026-06-25T00:00:00.000Z")).valid).toBe(true);
  });
});
