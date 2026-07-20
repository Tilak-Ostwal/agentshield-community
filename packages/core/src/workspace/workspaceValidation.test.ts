import { mkdirSync, writeFileSync } from "node:fs";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { defaultWorkspaceConfig } from "./workspaceConfig.js";
import { validateWorkspaceConfig } from "./workspaceValidation.js";

function fixtureRoot(): string {
  const root = mkdtempSync(join(tmpdir(), "agentshield-workspace-validation-"));
  mkdirSync(join(root, "examples", "policies"), { recursive: true });
  mkdirSync(join(root, "examples", "registry"), { recursive: true });
  writeFileSync(join(root, "examples", "policies", "strict.policy.json"), JSON.stringify({ version: 2, mode: "strict", defaultDecision: "deny", rules: [] }));
  writeFileSync(join(root, "examples", "registry", "agentshield.registry.json"), JSON.stringify({}));
  return root;
}

describe("workspace validation", () => {
  it("passes valid config with existing paths", () => {
    const result = validateWorkspaceConfig(defaultWorkspaceConfig, fixtureRoot());

    expect(result.ok).toBe(true);
    expect(result.findings).toContainEqual(expect.objectContaining({ id: "workspace.policy-pack.precedence", severity: "low" }));
  });

  it("missing policy path creates validation finding", () => {
    const root = fixtureRoot();
    const result = validateWorkspaceConfig({ ...defaultWorkspaceConfig, policyPath: "missing.policy.json" }, root);

    expect(result.ok).toBe(false);
    expect(result.findings).toContainEqual(
      expect.objectContaining({ id: "workspace.policy-path.missing", category: "missing_file", severity: "high" })
    );
  });

  it("unsafe dev profile creates warning", () => {
    const result = validateWorkspaceConfig({ ...defaultWorkspaceConfig, profile: "dev" }, fixtureRoot());

    expect(result.ok).toBe(true);
    expect(result.findings).toContainEqual(
      expect.objectContaining({ id: "workspace.profile.dev", category: "unsafe_setting", severity: "medium" })
    );
  });

  it("workspace validator recognizes policyPack", () => {
    const result = validateWorkspaceConfig(defaultWorkspaceConfig, fixtureRoot());

    expect(result.config).toMatchObject({ policyPack: "strict-mcp-local" });
    expect(result.findings).toContainEqual(expect.objectContaining({ id: "workspace.policy-pack.precedence", category: "recommendation" }));
  });
});
