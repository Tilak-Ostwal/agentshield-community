import { describe, expect, it } from "vitest";

import { createApprovalTicket } from "./approvalTicket.js";

describe("approval ticket", () => {
  it("creates approval ticket for require_human_review decision", () => {
    const ticket = createApprovalTicket({
      traceId: "trace_1",
      actionId: "write_1",
      actionHash: "hash_1",
      createdAt: "2026-06-25T00:00:00.000Z",
      expiresAt: "2026-06-25T00:10:00.000Z",
      currentDecision: "require_human_review",
      reason: "review required",
      riskMarkers: [{ type: "write_then_exec_same_path" }],
      capabilitiesObserved: ["filesystem.write"],
      taintObserved: []
    });

    expect(ticket).toMatchObject({
      version: 1,
      currentDecision: "require_human_review",
      riskMarkers: ["write_then_exec_same_path"]
    });
  });

  it("does not create approval tickets for non-review decisions", () => {
    expect(
      createApprovalTicket({
        traceId: "trace_1",
        actionId: "write_1",
        actionHash: "hash_1",
        createdAt: "2026-06-25T00:00:00.000Z",
        expiresAt: "2026-06-25T00:10:00.000Z",
        currentDecision: "deny",
        reason: "denied"
      })
    ).toBeUndefined();
  });

  it("redacts raw fake secrets from ticket fields", () => {
    const ticket = createApprovalTicket({
      traceId: "trace_1",
      actionId: "write_1",
      actionHash: "hash_1",
      createdAt: "2026-06-25T00:00:00.000Z",
      expiresAt: "2026-06-25T00:10:00.000Z",
      currentDecision: "require_human_review",
      reason: "review required",
      registryFindings: [{ detail: "sk-test-REDACT-ME" }]
    });

    expect(JSON.stringify(ticket)).not.toContain("sk-test-REDACT-ME");
  });
});
