import { describe, expect, it } from "vitest";
import { formatAttackGraphExplanationMarkdown } from "./attackGraphExplainReport.js";

describe("attackGraphExplainReport", () => {
  it("Markdown report contains summary, risk path, evidence, and recommendations", () => {
    const md = formatAttackGraphExplanationMarkdown({
      version: 1,
      explanationId: "1",
      category: "prompt_injection_chain",
      summary: "Sum",
      finalDecision: "deny",
      severity: "high",
      riskPath: [{ step: 1, nodeId: "n1", toolName: "t1", role: "r1", explanation: "e1" }],
      policy: { matchedRules: [], decisionReason: "reason" },
      registry: { toolTrustFindings: [] },
      sandbox: { sandboxFindings: [] },
      approval: { approvalFindings: [] },
      evidence: { evidenceRootHash: "hash", referencedEvents: [] },
      recommendations: [{ priority: "high", title: "T", details: "D" }]
    });

    expect(md).toContain("Summary");
    expect(md).toContain("Risk Path");
    expect(md).toContain("Policy & Evidence");
    expect(md).toContain("Fix Recommendations");
    expect(md).toContain("hash");
  });
});
