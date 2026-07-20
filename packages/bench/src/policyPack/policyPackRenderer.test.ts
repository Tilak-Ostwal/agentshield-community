import { evaluatePolicy } from "@agentshield/core";
import { describe, expect, it } from "vitest";

import { getPolicyPack } from "./builtInPolicyPacks.js";
import { renderPolicyPack } from "./policyPackRenderer.js";

function action(toolName: string) {
  return {
    actionId: "pack-test",
    timestamp: "2026-06-29T00:00:00.000Z",
    actionType: "tool_call",
    toolName,
    input: {}
  };
}

describe("policy pack renderer", () => {
  it("strict-mcp-local renders valid Policy v2", () => {
    expect(renderPolicyPack("strict-mcp-local").policy).toMatchObject({ version: 2, defaultDecision: "deny", mode: "strict" });
  });

  it("enterprise-sensitive-data denies secret network flows", () => {
    const result = evaluatePolicy(renderPolicyPack("enterprise-sensitive-data").policy, action("network.post"), {
      capabilities: ["network.write"],
      taintLabels: ["secret"]
    });

    expect(result).toMatchObject({ decision: "deny" });
  });

  it("ci-security denies external side effects", () => {
    const result = evaluatePolicy(renderPolicyPack("ci-security").policy, action("external.post"), {
      capabilities: ["external_side_effect"]
    });

    expect(result).toMatchObject({ decision: "deny", ruleId: "deny-external-side-effect" });
  });

  it("sandbox-required includes sandbox requirement metadata and rules", () => {
    const rendered = renderPolicyPack("sandbox-required");
    expect(rendered.warnings.join(" ")).toContain("sandbox");
    expect(rendered.policy.rules.map((rule) => rule.id)).toContain("review-sandbox-filesystem-write");
  });

  it("renders without raw fake secrets", () => {
    expect(JSON.stringify(renderPolicyPack(getPolicyPack("strict-mcp-local")))).not.toContain("sk-test-REDACT-ME");
  });
});
