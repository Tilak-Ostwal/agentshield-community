import { describe, expect, it } from "vitest";
import { createUnsignedApprovalToken, signApprovalToken } from "@agentshield/core";

import { createRuntimeContext } from "../context/runtimeContext.js";
import type { EvidenceTraceRecorder } from "../evidence/evidenceTraceRecorder.js";
import { processAction } from "../processor/actionProcessor.js";

const reviewPolicy = {
  version: 1,
  defaultDecision: "deny",
  rules: [
    { id: "review-write", match: { toolName: "filesystem.write" }, decision: "require_human_review" },
    { id: "allow-read", match: { toolName: "filesystem.read" }, decision: "allow" }
  ]
};

describe("runtime execution integration", () => {
  it("approval-gated action creates contract only with valid approval", () => {
    const action = {
      actionId: "write",
      timestamp: "2026-06-27T00:00:00.000Z",
      actionType: "tool_call",
      toolName: "filesystem.write",
      input: { path: "/mock/project/out.txt", content: "safe" }
    };
    const first = processAction(createRuntimeContext({ policy: reviewPolicy, now: () => new Date("2026-06-27T00:00:00.000Z") }), action, {
      execution: { enabled: true }
    });
    expect(first.decision).toBe("require_human_review");
    expect(first.executionContract).toBeUndefined();

    const token = signApprovalToken(
      createUnsignedApprovalToken({
        ticket: first.approvalTicket!,
        approvedDecision: "allow",
        approver: "local-dev",
        reason: "Reviewed",
        issuedAt: "2026-06-27T00:00:01.000Z"
      }),
      "fake-local-test-key"
    );
    const second = processAction(createRuntimeContext({ policy: reviewPolicy, now: () => new Date("2026-06-27T00:00:00.000Z") }), action, {
      approval: { token, signingKey: "fake-local-test-key" },
      execution: { enabled: true, approvalToken: token }
    });

    expect(second.decision).toBe("allow");
    expect(second.executionContract).toMatchObject({ decision: "require_human_review", allowedSideEffects: ["local_write"] });
  });

  it("evidence includes execution contract and preflight events", () => {
    const context = createRuntimeContext({ policy: reviewPolicy, traceId: "trace_execution" });
    processAction(
      context,
      {
        actionId: "read",
        timestamp: "2026-06-27T00:00:00.000Z",
        actionType: "tool_call",
        toolName: "filesystem.read",
        input: { path: "/mock/project/README.md" }
      },
      { execution: { enabled: true } }
    );
    const events = (context.traceRecorder as EvidenceTraceRecorder).getEvidenceEvents("trace_execution");

    expect(events.some((event) => event.type === "execution_contract_created")).toBe(true);
    expect(events.some((event) => event.type === "execution_preflight_passed")).toBe(true);
  });
});
