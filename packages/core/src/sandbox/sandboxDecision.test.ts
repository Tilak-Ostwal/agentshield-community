import { describe, expect, it } from "vitest";
import { evaluateSandboxDecision } from "./sandboxDecision.js";

function action(toolName: string, input: unknown = {}) {
  return { actionId: toolName, timestamp: "2026-06-28T00:00:00.000Z", actionType: "tool_call", toolName, input };
}

describe("sandbox decision", () => {
  it("filesystem.read maps to readonly", () => {
    expect(evaluateSandboxDecision({ action: action("filesystem.read"), capabilities: ["filesystem.read"] })).toMatchObject({ isolationLevel: "readonly" });
  });

  it("filesystem.write maps to write_limited", () => {
    expect(evaluateSandboxDecision({ action: action("filesystem.write"), capabilities: ["filesystem.write"] })).toMatchObject({ isolationLevel: "write_limited" });
  });

  it("shell.exec maps to dry_run_only", () => {
    expect(evaluateSandboxDecision({ action: action("shell.exec"), capabilities: ["shell.exec", "code_execution"] })).toMatchObject({ isolationLevel: "dry_run_only", decisionImpact: "dry_run" });
  });

  it("network.write maps to network_allowlisted", () => {
    expect(evaluateSandboxDecision({ action: action("network.post", { url: "https://example.invalid" }), capabilities: ["network.write"] })).toMatchObject({ isolationLevel: "network_allowlisted" });
  });

  it("package.install maps to blocked", () => {
    expect(evaluateSandboxDecision({ action: action("package.install"), capabilities: ["package.install"] })).toMatchObject({ isolationLevel: "blocked", decisionImpact: "deny" });
  });

  it("secret taint plus network.write maps to blocked", () => {
    expect(evaluateSandboxDecision({ action: action("network.post", { url: "https://example.invalid", token: "sk-test-REDACT-ME" }), capabilities: ["network.write"], taintLabels: ["secret"] })).toMatchObject({
      isolationLevel: "blocked",
      decisionImpact: "deny"
    });
  });
});
