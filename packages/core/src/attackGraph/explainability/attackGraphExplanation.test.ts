import { describe, expect, it } from "vitest";
import { attackGraphExplanationSchema } from "./attackGraphExplanation.js";

describe("attackGraphExplanation", () => {
  it("explanation model parses valid explanation", () => {
    const valid = {
      version: 1,
      explanationId: "graph-explanation-001",
      category: "secret_exfiltration_chain",
      summary: "Untrusted content caused a secret read followed by an external network write.",
      finalDecision: "deny",
      severity: "critical",
      riskPath: [
        {
          step: 1,
          nodeId: "node-1",
          toolName: "document.read",
          role: "untrusted_source",
          explanation: "The agent read untrusted content that contained instructions."
        }
      ],
      policy: {
        matchedRules: [],
        decisionReason: "Secret data flowed into an external sink."
      },
      registry: { toolTrustFindings: [] },
      sandbox: { sandboxFindings: [] },
      approval: { approvalFindings: [] },
      evidence: { evidenceRootHash: "abc", referencedEvents: [] },
      recommendations: [
        {
          priority: "high",
          title: "Deny secret-to-network flows",
          details: "Add or keep a deny rule for credential data sent to external network tools."
        }
      ]
    };

    const result = attackGraphExplanationSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });
});
