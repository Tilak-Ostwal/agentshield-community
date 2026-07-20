import { describe, expect, it } from "vitest";

import { createRuntimeContext } from "../context/runtimeContext.js";
import { processAction } from "../processor/actionProcessor.js";
import { checkRuntimeDecisionInvariants, checkRuntimeSecurityInvariants } from "./runtimeInvariants.js";

const allowReadPolicy = {
  version: 1,
  defaultDecision: "deny",
  rules: [
    {
      id: "allow-filesystem-read",
      match: {
        toolName: "filesystem.read"
      },
      decision: "allow"
    }
  ]
};

const allowLocalToolsPolicy = {
  version: 1,
  defaultDecision: "deny",
  rules: [
    {
      id: "allow-local-tool-calls",
      match: {
        actionType: "tool_call"
      },
      decision: "allow"
    }
  ]
};

function action(toolName: string, input?: unknown) {
  return {
    actionId: `action_${toolName.replace(".", "_")}`,
    timestamp: "2026-06-26T00:00:00.000Z",
    actionType: "tool_call",
    toolName,
    input
  };
}

describe("runtime invariants", () => {
  it("malformed actions cannot allow", () => {
    const context = createRuntimeContext({ policy: allowReadPolicy });
    const malformedInputs = [
      null,
      {},
      { actionId: "", timestamp: "not-a-date", actionType: "tool_call", toolName: "filesystem.read" },
      { actionId: "bad", timestamp: "2026-06-26T00:00:00.000Z", actionType: "" },
      { actionId: "bad", timestamp: "2026-06-26T00:00:00.000Z", actionType: "tool_call", extra: true }
    ];

    for (const malformedInput of malformedInputs) {
      expect(processAction(context, malformedInput).decision).not.toBe("allow");
    }
  });

  it("missing policy fails closed with deny", () => {
    const result = processAction(createRuntimeContext(), action("filesystem.read"));

    expect(result).toMatchObject({
      decision: "deny",
      ruleId: "fail-closed"
    });
  });

  it("LLM advisory allow cannot override deterministic deny", () => {
    const result = processAction(
      createRuntimeContext({
        policy: {
          version: 1,
          defaultDecision: "deny",
          rules: []
        }
      }),
      {
        ...action("unknown.tool"),
        llmAdvisory: {
          decision: "allow",
          reason: "trust me"
        }
      }
    );

    expect(result.decision).toBe("deny");
  });

  it("every traced runtime decision has traceId and eventIds", () => {
    const context = createRuntimeContext({ policy: allowReadPolicy });
    const result = processAction(context, action("filesystem.read"));

    expect(checkRuntimeDecisionInvariants(result).passed).toBe(true);
  });

  it("fake secrets never appear in trace JSON", () => {
    const context = createRuntimeContext({ policy: allowReadPolicy });
    const result = processAction(
      context,
      action("filesystem.read", {
        token: "sk-test-REDACT-ME"
      })
    );

    expect(checkRuntimeSecurityInvariants(result, context.traceRecorder.getEvents(), ["sk-test-REDACT-ME"]).passed).toBe(
      true
    );
  });

  it("changed fingerprints cannot silently allow", () => {
    const context = createRuntimeContext({ policy: allowReadPolicy });
    const metadata = {
      toolName: "filesystem.read",
      serverName: "local",
      schema: { path: "string" },
      description: "Read",
      capabilities: ["read"]
    };

    processAction(context, action("filesystem.read"), { toolMetadata: metadata });
    const result = processAction(context, action("filesystem.read"), {
      toolMetadata: {
        ...metadata,
        description: "Read with changed behavior"
      }
    });

    expect(result.decision).not.toBe("allow");
  });

  it("write-then-exec cannot silently allow", () => {
    const context = createRuntimeContext({ policy: allowLocalToolsPolicy });

    processAction(context, action("filesystem.write", { path: "/mock/project/payload.js" }));
    const result = processAction(context, action("shell.exec", { path: "/mock/project/payload.js" }));

    expect(result.decision).not.toBe("allow");
  });

  it("runtime invariant checker reports bad test data clearly", () => {
    const result = checkRuntimeDecisionInvariants({
      decision: "allow",
      reason: "",
      traceId: ""
    });

    expect(result.passed).toBe(false);
    expect(result.checks.map((check) => check.message).join(" ")).toContain("missing");
  });
});
