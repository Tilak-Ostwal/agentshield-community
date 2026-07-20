import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { runPolicyAudit } from "../policyAudit/policyAuditRunner.js";
import { runPolicyTestFile } from "../policyTest/policyTestRunner.js";
import type { PolicyTestFile } from "../policyTest/policyTestSchema.js";
import { renderPolicyTemplate, renderPolicyTemplateJson } from "./policyTemplateRenderer.js";

describe("policyTemplateRenderer", () => {
  it("shows metadata and rendered policy", () => {
    const rendered = renderPolicyTemplate("strict-mcp-local");
    expect(rendered.templateId).toBe("strict-mcp-local");
    expect(rendered.policy.defaultDecision).toBe("deny");
  });

  it("renders policy JSON", () => {
    expect(JSON.parse(renderPolicyTemplateJson("strict-mcp-local"))).toMatchObject({ version: 2, defaultDecision: "deny" });
  });

  it("generated strict policy passes policy-audit", () => {
    const cwd = mkdtempSync(join(tmpdir(), "agentshield-template-audit-"));
    writeFileSync(join(cwd, "generated.policy.json"), renderPolicyTemplateJson("strict-mcp-local"));
    expect(runPolicyAudit("generated.policy.json", {}, cwd).summary.passed).toBe(true);
  });

  it("generated strict policy can run policy-test", () => {
    const cwd = mkdtempSync(join(tmpdir(), "agentshield-template-policy-test-"));
    writeFileSync(join(cwd, "generated.policy.json"), renderPolicyTemplateJson("strict-mcp-local"));
    const file: PolicyTestFile = {
      version: 1,
      name: "generated-strict",
      policyPath: "generated.policy.json",
      tests: [
        {
          id: "allow-read",
          name: "Allow read",
          action: {
            actionId: "read",
            timestamp: "2026-06-28T00:00:00.000Z",
            actionType: "tool_call",
            toolName: "filesystem.read",
            input: { path: "/mock/project/README.md" }
          },
          expected: { decision: "allow", ruleId: "allow-readonly-project-files" }
        }
      ]
    };
    expect(runPolicyTestFile(file, cwd).failed).toBe(0);
  });
});
