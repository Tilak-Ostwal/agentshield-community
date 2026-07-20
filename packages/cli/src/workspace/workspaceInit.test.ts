import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { initWorkspaceConfig } from "./workspaceInit.js";

function tempDirectory(): string {
  return mkdtempSync(join(tmpdir(), "agentshield-workspace-init-"));
}

describe("workspace init", () => {
  it("creates config", () => {
    const directory = tempDirectory();
    try {
      const result = initWorkspaceConfig("agentshield.workspace.json", { cwd: directory });
      expect(result.ok).toBe(true);
      expect(existsSync(join(directory, "agentshield.workspace.json"))).toBe(true);
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it("refuses overwrite without force", () => {
    const directory = tempDirectory();
    const path = join(directory, "agentshield.workspace.json");
    try {
      writeFileSync(path, "existing");
      const result = initWorkspaceConfig("agentshield.workspace.json", { cwd: directory });
      expect(result.ok).toBe(false);
      expect(readFileSync(path, "utf8")).toBe("existing");
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it("writes with force", () => {
    const directory = tempDirectory();
    const path = join(directory, "agentshield.workspace.json");
    try {
      writeFileSync(path, "existing");
      const result = initWorkspaceConfig("agentshield.workspace.json", { cwd: directory, force: true });
      expect(result.ok).toBe(true);
      expect(readFileSync(path, "utf8")).toContain("\"version\": 1");
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });
});
