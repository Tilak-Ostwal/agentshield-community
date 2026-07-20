import { describe, expect, it } from "vitest";

import type { PolicyV2 } from "@agentshield/core";
import type { RegistryFile } from "@agentshield/registry";

import { analyzePolicyCoverage } from "./policyCoverageAnalyzer.js";

const strictPolicy: PolicyV2 = {
  version: 2,
  name: "strict",
  defaultDecision: "deny",
  mode: "strict",
  rules: [
    { id: "deny-shell", effect: "deny", priority: 100, match: { capability: "shell.exec" } },
    { id: "deny-code", effect: "deny", priority: 99, match: { capability: "code_execution" } },
    { id: "deny-package", effect: "deny", priority: 98, match: { capability: "package.install" } },
    { id: "deny-delete", effect: "deny", priority: 97, match: { capability: "filesystem.delete" } },
    { id: "deny-secret-network", effect: "deny", priority: 96, match: { capabilitiesAny: ["network.write"], taintAny: ["secret", "credential"] } },
    { id: "review-network", effect: "require_human_review", priority: 90, match: { capability: "network.write" }, requireApproval: { reason: "network write" } },
    { id: "review-git", effect: "require_human_review", priority: 90, match: { capability: "git.write" }, requireApproval: { reason: "git write" } },
    { id: "allow-read", effect: "allow", priority: 10, match: { capability: "filesystem.read", resource: { type: "filesystem", allow: ["/mock/project/**"] } } }
  ]
};

describe("policyCoverageAnalyzer", () => {
  it("allows strict policies to pass with no critical or dangerous allow findings", () => {
    const findings = analyzePolicyCoverage(strictPolicy);
    expect(findings.filter((finding) => finding.severity === "critical")).toHaveLength(0);
    expect(findings.filter((finding) => finding.category === "dangerous_allow")).toHaveLength(0);
  });

  it("flags broad allow policies", () => {
    const findings = analyzePolicyCoverage({
      ...strictPolicy,
      rules: [{ id: "allow-all", effect: "allow", priority: 1, match: { toolNamePattern: "*" } }]
    });
    expect(findings.some((finding) => finding.category === "dangerous_allow")).toBe(true);
  });

  it("flags missing shell deny or review", () => {
    const findings = analyzePolicyCoverage({ ...strictPolicy, rules: strictPolicy.rules.filter((rule) => rule.id !== "deny-shell" && rule.id !== "deny-code") });
    expect(findings.some((finding) => finding.id === "coverage-dangerous-shell-exec" && (finding.severity === "critical" || finding.severity === "high"))).toBe(true);
  });

  it("flags blocked registry tools that are allowed", () => {
    const registry: RegistryFile = {
      version: 1,
      name: "test",
      generatedAt: "2026-06-28T00:00:00.000Z",
      entries: [
        {
          version: 1,
          toolName: "shell.exec",
          serverName: "mock",
          trustLevel: "blocked",
          expectedFingerprint: {
            schemaHash: "a".repeat(64),
            descriptionHash: "b".repeat(64),
            capabilityHash: "c".repeat(64)
          },
          declaredCapabilities: ["shell.exec"],
          riskLevel: "critical"
        }
      ]
    };
    const findings = analyzePolicyCoverage({ ...strictPolicy, rules: [...strictPolicy.rules, { id: "allow-shell", effect: "allow", priority: 1, match: { toolName: "shell.exec" } }] }, registry);
    expect(findings.some((finding) => finding.id === "registry-blocked-allowed-shell-exec" && finding.severity === "critical")).toBe(true);
  });

  it("detects missing registry coverage", () => {
    const registry: RegistryFile = {
      version: 1,
      name: "test",
      generatedAt: "2026-06-28T00:00:00.000Z",
      entries: [
        {
          version: 1,
          toolName: "database.write",
          serverName: "mock",
          trustLevel: "reviewed",
          expectedFingerprint: {
            schemaHash: "a".repeat(64),
            descriptionHash: "b".repeat(64),
            capabilityHash: "c".repeat(64)
          },
          declaredCapabilities: ["database.write"],
          riskLevel: "high"
        }
      ]
    };
    expect(analyzePolicyCoverage(strictPolicy, registry).some((finding) => finding.category === "registry_gap")).toBe(true);
  });
});
