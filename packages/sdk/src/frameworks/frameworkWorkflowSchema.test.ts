import { describe, expect, it } from "vitest";
import { parseFrameworkWorkflow } from "./frameworkWorkflowSchema.js";

describe("frameworkWorkflowSchema", () => {
  it("framework workflow schema parses valid workflow", () => {
    const parsed = parseFrameworkWorkflow({
      version: 1,
      workflowId: "blocked-secret-exfiltration-workflow",
      name: "Blocked Secret Exfiltration Workflow",
      steps: [
        {
          stepId: "read-secret",
          toolName: "filesystem.read",
          input: { path: "/mock/project/.env" }
        }
      ],
      expectedFinalDecision: "deny"
    });
    expect(parsed.workflowId).toBe("blocked-secret-exfiltration-workflow");
    expect(parsed.steps.length).toBe(1);
  });

  it("invalid workflow fails closed", () => {
    expect(() => parseFrameworkWorkflow({ version: 2 })).toThrow();
    expect(() => parseFrameworkWorkflow({ version: 1, workflowId: "a", name: "b", steps: [{ stepId: "" }] })).toThrow();
  });
});
