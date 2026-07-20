import { describe, expect, it } from "vitest";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { runPolicyTestFile } from "./policyTestRunner.js";
import type { PolicyTestFile } from "./policyTestSchema.js";

const baseAction = {
  timestamp: "2026-06-28T00:00:00.000Z",
  actionType: "tool_call" as const
};

function file(expectedDecision: "allow" | "deny" | "require_human_review", capabilitiesAny: string[] = ["filesystem.read"]): PolicyTestFile {
  return {
    version: 1,
    name: "test",
    policyPath: "examples/policies/strict.policy.json",
    tests: [
      {
        id: "read",
        name: "Read project file",
        action: {
          ...baseAction,
          actionId: "read",
          toolName: "filesystem.read",
          input: { path: "/mock/project/README.md" }
        },
        expected: { decision: expectedDecision, capabilitiesAny }
      }
    ]
  };
}

describe("policy test runner", () => {
  it("passes expected allow", () => {
    const result = runPolicyTestFile(file("allow"), joinRoot());
    expect(result.failed).toBe(0);
  });

  it("passes expected deny", () => {
    const result = runPolicyTestFile({
      version: 1,
      name: "deny",
      policyPath: "examples/policies/strict.policy.json",
      tests: [
        {
          id: "shell",
          name: "Shell denied",
          action: { ...baseAction, actionId: "shell", toolName: "shell.exec", input: { command: "echo mock" } },
          expected: { decision: "deny", capabilitiesAny: ["shell.exec"] }
        }
      ]
    }, joinRoot());
    expect(result.failed).toBe(0);
  });

  it("fails wrong expected decision", () => {
    const result = runPolicyTestFile(file("deny"), joinRoot());
    expect(result.failed).toBe(1);
  });

  it("detects missing expected capability", () => {
    const result = runPolicyTestFile(file("allow", ["network.write"]), joinRoot());
    expect(result.failed).toBe(1);
    expect(result.results[0]!.assertions.some((assertion) => assertion.field === "capabilitiesAny" && !assertion.passed)).toBe(true);
  });
});

function joinRoot(): string {
  return join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "..");
}
