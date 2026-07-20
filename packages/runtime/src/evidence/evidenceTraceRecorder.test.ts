import { describe, expect, it } from "vitest";

import { createRuntimeContext } from "../context/runtimeContext.js";
import { processAction } from "../processor/actionProcessor.js";
import { EvidenceTraceRecorder } from "./evidenceTraceRecorder.js";

describe("EvidenceTraceRecorder", () => {
  it("redacts fake secrets before hashing", () => {
    const recorder = new EvidenceTraceRecorder();

    recorder.record({
      trace_id: "trace_1",
      event_id: "event_1",
      timestamp: "2026-06-26T00:00:00.000Z",
      type: "action_received",
      actor: { kind: "runtime", id: "runtime" },
      data: { token: "sk-test-REDACT-ME" },
      redactions: []
    });

    const serialized = JSON.stringify(recorder.getEvidenceEvents());

    expect(serialized).not.toContain("sk-test-REDACT-ME");
    expect(serialized).toContain("[REDACTED]");
    expect(recorder.getEvidenceRootHash("trace_1")).toHaveLength(64);
  });

  it("runtime decisions include evidenceRootHash with evidence recorder", () => {
    const result = processAction(
      createRuntimeContext({
        policy: {
          version: 1,
          defaultDecision: "deny",
          rules: [{ id: "allow-read", match: { capability: "filesystem.read" }, decision: "allow" }]
        }
      }),
      {
        actionId: "read_1",
        timestamp: "2026-06-26T00:00:00.000Z",
        actionType: "tool_call",
        toolName: "filesystem.read",
        input: { path: "/mock/project/readme.md" }
      }
    );

    expect(result.evidenceRootHash).toHaveLength(64);
  });

  it("evidence trace includes redacted policy explanation", () => {
    const context = createRuntimeContext({
      policy: {
        version: 2,
        name: "redacted-explanation",
        defaultDecision: "deny",
        mode: "strict",
        rules: [
          {
            id: "allow-secret-looking-path",
            effect: "allow",
            priority: 1,
            match: {
              capability: "filesystem.read",
              resource: { type: "filesystem", allow: ["/mock/project/**"] }
            }
          }
        ]
      }
    });

    processAction(context, {
      actionId: "read_secret_path",
      timestamp: "2026-06-26T00:00:00.000Z",
      actionType: "tool_call",
      toolName: "filesystem.read",
      input: { path: "/mock/project/sk-test-REDACT-ME" }
    });

    expect(context.traceRecorder).toBeInstanceOf(EvidenceTraceRecorder);
    const serialized = JSON.stringify((context.traceRecorder as EvidenceTraceRecorder).getEvidenceEvents());

    expect(serialized).toContain("policyExplanation");
    expect(serialized).not.toContain("sk-test-REDACT-ME");
  });
});
