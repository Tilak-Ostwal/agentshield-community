import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { defaultWorkspaceConfig, renderWorkspaceConfigJson } from "@agentshield/core";
import { describe, expect, it } from "vitest";

import { runWorkspaceCommand } from "./workspaceCommands.js";

function tempDirectory(): string {
  return mkdtempSync(join(tmpdir(), "agentshield-workspace-command-"));
}

describe("workspace commands", () => {
  it("validate CLI text works", () => {
    const cwd = join(process.cwd(), "..", "..");
    const result = runWorkspaceCommand(["validate", "examples/workspace/agentshield.workspace.json"], cwd);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("AgentShield workspace validation: PASS");
  });

  it("doctor CLI text works", () => {
    const cwd = join(process.cwd(), "..", "..");
    const result = runWorkspaceCommand(["doctor", "examples/workspace/agentshield.workspace.json"], cwd);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("AgentShield workspace doctor: PASS");
  });

  it("doctor CLI JSON works", () => {
    const cwd = join(process.cwd(), "..", "..");
    const result = runWorkspaceCommand(["doctor", "examples/workspace/agentshield.workspace.json", "--format", "json"], cwd);

    expect(result.exitCode).toBe(0);
    expect(JSON.parse(result.stdout)).toMatchObject({ ok: true });
  });

  it("validate fails closed for missing policy path", () => {
    const directory = tempDirectory();
    try {
      writeFileSync(
        join(directory, "agentshield.workspace.json"),
        renderWorkspaceConfigJson({ ...defaultWorkspaceConfig, policyPath: "missing.policy.json" })
      );
      const result = runWorkspaceCommand(["validate", "agentshield.workspace.json"], directory);
      expect(result.exitCode).toBe(1);
      expect(result.stdout).toContain("workspace.policy-path.missing");
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });
});
