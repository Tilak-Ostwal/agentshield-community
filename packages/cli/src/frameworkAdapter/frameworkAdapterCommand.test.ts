import { describe, expect, it } from "vitest";
import { runFrameworkAdapterCommand } from "./frameworkAdapterCommand.js";
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

interface FrameworkWrapJson {
  valid: boolean;
}

interface FrameworkRunJson {
  finalDecision: string;
}

describe("frameworkAdapterCommand", () => {
  const tmpDir = join(process.cwd(), "tmp-fw-adapter");

  it("CLI wrap text works", () => {
    mkdirSync(tmpDir, { recursive: true });
    writeFileSync(join(tmpDir, "registry.json"), JSON.stringify([{ version: 1, toolId: "t1", name: "t1", description: "t1" }]));
    const res = runFrameworkAdapterCommand(["wrap", "registry.json"], tmpDir);
    expect(res.exitCode).toBe(0);
    expect(res.stdout).toContain("Framework Tool Registry Validated");
  });

  it("CLI wrap JSON works", () => {
    const res = runFrameworkAdapterCommand(["wrap", "registry.json", "--format", "json"], tmpDir);
    expect(res.exitCode).toBe(0);
    expect((JSON.parse(res.stdout) as FrameworkWrapJson).valid).toBe(true);
  });

  it("CLI run-demo safe workflow works", () => {
    writeFileSync(join(tmpDir, "safe.json"), JSON.stringify({
      version: 1, workflowId: "w1", name: "safe", steps: [{ stepId: "s1", toolName: "filesystem.read" }]
    }));
    const res = runFrameworkAdapterCommand(["run-demo", "safe.json"], tmpDir);
    expect(res.exitCode).toBe(0);
    expect(res.stdout).toContain("Final Decision: ALLOW");
  });

  it("CLI run-demo blocked workflow works", () => {
    writeFileSync(join(tmpDir, "blocked.json"), JSON.stringify({
      version: 1, workflowId: "w2", name: "blocked", steps: [{ stepId: "s1", toolName: "filesystem.read", input: { path: ".env" } }, { stepId: "s2", toolName: "network.post" }]
    }));
    const res = runFrameworkAdapterCommand(["run-demo", "blocked.json"], tmpDir);
    expect(res.exitCode).toBe(0);
    expect(res.stdout).toContain("Final Decision: DENY");
    expect(res.stdout).toContain("secret_to_network");
  });

  it("CLI run-demo JSON works", () => {
    const res = runFrameworkAdapterCommand(["run-demo", "blocked.json", "--format", "json"], tmpDir);
    expect(res.exitCode).toBe(0);
    expect((JSON.parse(res.stdout) as FrameworkRunJson).finalDecision).toBe("deny");
  });
});
