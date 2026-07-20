import { describe, expect, it } from "vitest";
import { createRuntimeContext } from "../context/runtimeContext.js";
import type { EvidenceTraceRecorder } from "../evidence/evidenceTraceRecorder.js";
import { processAction } from "../processor/actionProcessor.js";

const allowAllPolicy = {
  version: 1,
  defaultDecision: "deny",
  rules: [{ id: "allow-all", match: { actionType: "tool_call" }, decision: "allow" }]
};

describe("runtime sandbox integration", () => {
  it("execution contract includes sandbox profile when applicable", () => {
    const result = processAction(
      createRuntimeContext({ policy: allowAllPolicy }),
      { actionId: "read", timestamp: "2026-06-28T00:00:00.000Z", actionType: "tool_call", toolName: "filesystem.read", input: { path: "/mock/project/README.md" } },
      { sandbox: { enabled: true }, execution: { enabled: true } }
    );

    expect(result.executionContract).toMatchObject({ sandboxProfileId: "sandbox_readonly" });
  });

  it("sandbox evidence contains no raw fake secret", () => {
    const context = createRuntimeContext({ policy: allowAllPolicy, traceId: "trace_sandbox" });
    processAction(
      context,
      { actionId: "read", timestamp: "2026-06-28T00:00:00.000Z", actionType: "tool_call", toolName: "filesystem.read", input: { path: "/mock/project/README.md", token: "sk-test-REDACT-ME" } },
      { sandbox: { enabled: true }, execution: { enabled: true } }
    );
    const events = (context.traceRecorder as EvidenceTraceRecorder).getEvidenceEvents("trace_sandbox");

    expect(events.some((event) => event.type === "sandbox_profile_selected")).toBe(true);
    expect(JSON.stringify(events)).not.toContain("sk-test-REDACT-ME");
  });
});
