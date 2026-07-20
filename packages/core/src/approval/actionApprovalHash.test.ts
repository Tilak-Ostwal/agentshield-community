import { describe, expect, it } from "vitest";

import { createActionApprovalHash } from "./actionApprovalHash.js";

const action = {
  actionId: "write_1",
  timestamp: "2026-06-25T00:00:00.000Z",
  actionType: "tool_call",
  toolName: "filesystem.write",
  input: { path: "/mock/project/out.txt", content: "safe" }
};

describe("action approval hash", () => {
  it("is deterministic for the same action and context", () => {
    const input = {
      action,
      policyContext: { ruleId: "review-write" },
      riskContext: { capabilitiesObserved: ["filesystem.write"] },
      ticketContext: { traceId: "trace_1", actionId: "write_1", requestedDecision: "allow" as const }
    };

    expect(createActionApprovalHash(input)).toBe(createActionApprovalHash(input));
  });

  it("changes when action input changes", () => {
    const first = createActionApprovalHash({ action });
    const second = createActionApprovalHash({ action: { ...action, input: { path: "/mock/project/other.txt", content: "safe" } } });

    expect(second).not.toBe(first);
  });

  it("changes when capability or taint context changes", () => {
    const first = createActionApprovalHash({ action, riskContext: { capabilitiesObserved: ["filesystem.write"], taintObserved: [] } });
    const second = createActionApprovalHash({ action, riskContext: { capabilitiesObserved: ["network.write"], taintObserved: ["secret"] } });

    expect(second).not.toBe(first);
  });
});
