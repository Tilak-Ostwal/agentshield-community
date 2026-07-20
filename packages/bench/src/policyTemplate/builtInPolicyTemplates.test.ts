import { describe, expect, it } from "vitest";

import { compilePolicyV2 } from "@agentshield/core";

import { getPolicyTemplate, listPolicyTemplates } from "./builtInPolicyTemplates.js";

describe("builtInPolicyTemplates", () => {
  it("lists all built-in templates", () => {
    expect(listPolicyTemplates().map((template) => template.id)).toEqual([
      "ci-security-gate",
      "dev-warning-mode",
      "docs-agent",
      "enterprise-sensitive-data",
      "readonly-coding-agent",
      "registry-enforced",
      "sandbox-required",
      "strict-mcp-local"
    ]);
  });

  it("strict-mcp-local renders valid Policy v2", () => {
    expect(compilePolicyV2(getPolicyTemplate("strict-mcp-local").policy).ok).toBe(true);
  });

  it("readonly-coding-agent denies shell, network, and write", () => {
    const rules = getPolicyTemplate("readonly-coding-agent").policy.rules;
    expect(rules.some((rule) => rule.effect === "deny" && rule.match.capability === "shell.exec")).toBe(true);
    expect(rules.some((rule) => rule.effect === "deny" && rule.match.capability === "network.write")).toBe(true);
    expect(rules.some((rule) => rule.effect === "deny" && rule.match.capability === "filesystem.write")).toBe(true);
  });

  it("enterprise-sensitive-data denies secret network flows", () => {
    expect(
      getPolicyTemplate("enterprise-sensitive-data").policy.rules.some(
        (rule) => rule.effect === "deny" && rule.match.capabilitiesAny?.includes("network.write") === true && rule.match.taintAny?.includes("secret") === true
      )
    ).toBe(true);
  });

  it("dev-warning-mode includes warning metadata", () => {
    expect(getPolicyTemplate("dev-warning-mode").warnings.join(" ")).toContain("not production-ready");
  });
});
