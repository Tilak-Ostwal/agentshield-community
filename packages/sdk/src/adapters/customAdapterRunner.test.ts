import { describe, expect, it } from "vitest";

import type { RuntimeDecision } from "@agentshield/runtime";

import { executeAdapterActionSafely } from "./customAdapterRunner.js";

const action = {
  actionId: "read",
  timestamp: "2026-06-28T00:00:00.000Z",
  actionType: "tool_call" as const,
  toolName: "filesystem.read",
  input: {}
};

function decision(overrides: Partial<RuntimeDecision> = {}): RuntimeDecision {
  return {
    decision: "allow",
    reason: "allowed",
    ruleId: "allow",
    riskMarkers: [],
    capabilitiesObserved: [],
    taintObserved: [],
    approvalStatus: "not_required",
    executionPreflightStatus: "not_applicable",
    traceId: "trace",
    eventIds: [],
    ...overrides
  } as RuntimeDecision;
}

describe("custom adapter runner", () => {
  it("allowed action forwards to mock adapter", async () => {
    const result = await executeAdapterActionSafely({
      adapterId: "custom",
      adapterName: "Custom",
      protocol: "custom",
      listTools: async () => [],
      normalizeToolCall: async () => action,
      executeAllowedAction: async () => ({ ok: true, status: "executed", output: "ok" })
    }, action, decision());
    expect(result).toMatchObject({ ok: true, status: "executed" });
  });

  it("denied action does not forward", async () => {
    const result = await executeAdapterActionSafely({
      adapterId: "custom",
      adapterName: "Custom",
      protocol: "custom",
      listTools: async () => [],
      normalizeToolCall: async () => action,
      executeAllowedAction: async () => { throw new Error("should not run"); }
    }, action, decision({ decision: "deny" }));
    expect(result.status).toBe("blocked");
  });

  it("review action does not forward", async () => {
    expect((await executeAdapterActionSafely({
      adapterId: "custom",
      adapterName: "Custom",
      protocol: "custom",
      listTools: async () => [],
      normalizeToolCall: async () => action,
      executeAllowedAction: async () => ({ ok: true, status: "executed" })
    }, action, decision({ decision: "require_human_review", approvalStatus: "required" }))).status).toBe("blocked");
  });

  it("sandbox-blocked action does not forward", async () => {
    expect((await executeAdapterActionSafely({
      adapterId: "custom",
      adapterName: "Custom",
      protocol: "custom",
      listTools: async () => [],
      normalizeToolCall: async () => action,
      executeAllowedAction: async () => ({ ok: true, status: "executed" })
    }, action, decision({ sandboxDecision: { decisionImpact: "deny", isolationLevel: "blocked" } as never }))).status).toBe("blocked");
  });

  it("adapter execution error fails closed", async () => {
    expect((await executeAdapterActionSafely({
      adapterId: "custom",
      adapterName: "Custom",
      protocol: "custom",
      listTools: async () => [],
      normalizeToolCall: async () => action,
      executeAllowedAction: async () => { throw new Error("token sk-test-REDACT-ME"); }
    }, action, decision()))).toMatchObject({ ok: false, status: "error" });
  });
});
