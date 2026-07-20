import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { runPolicyAudit } from "./policyAuditRunner.js";

const basePolicy = {
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

function writeFixture(name: string, value: unknown): { cwd: string; path: string } {
  const cwd = mkdtempSync(join(tmpdir(), "agentshield-policy-audit-"));
  writeFileSync(join(cwd, name), JSON.stringify(value, null, 2));
  return { cwd, path: name };
}

describe("policyAuditRunner", () => {
  it("audits a strict policy with pass status", () => {
    const fixture = writeFixture("policy.json", basePolicy);
    expect(runPolicyAudit(fixture.path, {}, fixture.cwd).summary.passed).toBe(true);
  });

  it("fails broad dangerous allow policies", () => {
    const fixture = writeFixture("policy.json", { ...basePolicy, rules: [{ id: "allow-all", effect: "allow", priority: 1, match: { toolNamePattern: "*" } }] });
    const result = runPolicyAudit(fixture.path, {}, fixture.cwd);
    expect(result.summary.passed).toBe(false);
    expect(result.findings.some((finding) => finding.category === "dangerous_allow")).toBe(true);
  });
});
