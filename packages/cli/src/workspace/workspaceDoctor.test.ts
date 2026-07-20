import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { runWorkspaceDoctor } from "./workspaceDoctor.js";

describe("workspace doctor", () => {
  it("passes for example workspace", () => {
    const cwd = join(process.cwd(), "..", "..");
    const result = runWorkspaceDoctor("examples/workspace/agentshield.workspace.json", cwd);

    expect(result.ok).toBe(true);
    expect(result.checks.some((check) => check.id === "workspace.no-raw-fake-secret" && check.status === "pass")).toBe(true);
  });
});
