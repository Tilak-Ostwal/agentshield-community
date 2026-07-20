import { describe, expect, it } from "vitest";

import { createRuntimeContext } from "../context/runtimeContext.js";
import { processAction } from "./actionProcessor.js";

const allowReadPolicy = {
  version: 1,
  defaultDecision: "deny",
  rules: [
    {
      id: "allow-filesystem-read",
      match: {
        actionType: "tool_call",
        toolName: "filesystem.read"
      },
      decision: "allow"
    }
  ]
};

function action(toolName: string, input?: unknown) {
  return {
    actionId: `action_${toolName}`,
    timestamp: "2026-06-25T00:00:00.000Z",
    actionType: "tool_call",
    toolName,
    input
  };
}

describe("runtime action processor", () => {
  it("denies unknown tools by default", () => {
    const context = createRuntimeContext({ policy: allowReadPolicy });
    const result = processAction(context, action("unknown.exfiltrate"));

    expect(result).toMatchObject({
      decision: "deny",
      ruleId: "default-deny"
    });
  });

  it("allows explicitly allowed tools", () => {
    const context = createRuntimeContext({ policy: allowReadPolicy });
    const result = processAction(context, action("filesystem.read"));

    expect(result).toMatchObject({
      decision: "allow",
      ruleId: "allow-filesystem-read"
    });
  });

  it("runtime supports v1 policy unchanged", () => {
    const context = createRuntimeContext({ policy: allowReadPolicy });

    expect(processAction(context, action("filesystem.read")).decision).toBe("allow");
  });

  it("runtime supports v2 policy", () => {
    const context = createRuntimeContext({
      policy: {
        version: 2,
        name: "runtime-v2",
        defaultDecision: "deny",
        mode: "strict",
        rules: [
          {
            id: "allow-project-read",
            effect: "allow",
            priority: 10,
            match: {
              capability: "filesystem.read",
              resource: { type: "filesystem", allow: ["/mock/project/**"] }
            }
          }
        ]
      }
    });
    const result = processAction(context, action("filesystem.read", { path: "/mock/project/readme.md" }));

    expect(result).toMatchObject({
      decision: "allow",
      ruleId: "allow-project-read",
      policyExplanation: expect.objectContaining({ winningRule: "allow-project-read" })
    });
  });

  it("fails closed for invalid actions", () => {
    const context = createRuntimeContext({ policy: allowReadPolicy });
    const result = processAction(context, { actionId: "", actionType: "tool_call" });

    expect(result).toMatchObject({
      decision: "deny",
      ruleId: "fail-closed",
      eventIds: []
    });
  });

  it("never stores raw password token or apiKey values in traces", () => {
    const context = createRuntimeContext({ policy: allowReadPolicy });

    processAction(
      context,
      action("filesystem.read", {
        password: "raw-password",
        token: "raw-token",
        apiKey: "sk-1234567890abcdef1234567890abcdef"
      })
    );

    const serializedTrace = JSON.stringify(context.traceRecorder.getEvents());

    expect(serializedTrace).not.toContain("raw-password");
    expect(serializedTrace).not.toContain("raw-token");
    expect(serializedTrace).not.toContain("sk-1234567890");
  });

  it("returns trace id and event ids", () => {
    const context = createRuntimeContext({ policy: allowReadPolicy, traceId: "trace_test" });
    const result = processAction(context, action("filesystem.read"));

    expect(result.traceId).toBe("trace_test");
    expect(result.eventIds.length).toBeGreaterThan(0);
  });

  it("creates a high-risk marker for write then exec on the same path", () => {
    const context = createRuntimeContext({
      policy: {
        version: 1,
        defaultDecision: "deny",
        rules: [
          {
            id: "allow-tool-calls",
            match: { actionType: "tool_call" },
            decision: "allow"
          }
        ]
      }
    });

    processAction(context, action("filesystem.write", { path: "tmp/payload.js" }));
    const result = processAction(context, action("shell.exec", { path: "tmp/payload.js" }));

    expect(result.decision).toBe("deny");
    expect(result.riskMarkers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: "write_then_exec_same_path" }),
        expect.objectContaining({ type: "attack_graph_finding", patternId: "write-then-exec" })
      ])
    );
    expect(context.traceRecorder.getEvents().some((event) => event.type === "session_risk_detected")).toBe(true);
  });

  it("emits fingerprint_changed and requires review when a tool fingerprint changes", () => {
    const context = createRuntimeContext({ policy: allowReadPolicy });
    const metadata = {
      toolName: "filesystem.read",
      serverName: "local",
      schema: { path: "string" },
      description: "Read a file",
      capabilities: ["read"]
    };

    processAction(context, action("filesystem.read"), { toolMetadata: metadata });
    const result = processAction(context, action("filesystem.read"), {
      toolMetadata: {
        ...metadata,
        schema: { path: "string", encoding: "string" }
      }
    });

    expect(result).toMatchObject({
      decision: "require_human_review",
      ruleId: "runtime-fingerprint-changed"
    });
    expect(context.traceRecorder.getEvents().some((event) => event.type === "fingerprint_changed")).toBe(true);
  });

  it("does not let llm advisory fields override deterministic policy", () => {
    const context = createRuntimeContext({
      policy: {
        version: 1,
        defaultDecision: "deny",
        rules: []
      }
    });
    const result = processAction(context, {
      ...action("unknown.exfiltrate"),
      llmAdvisory: { decision: "allow" }
    });

    expect(result.decision).toBe("deny");
  });
});
