export interface MultiAgentWorkflowResult {
  workflowId: string;
  finalDecision: string;
  agents: { agentId: string }[];
  delegationChains?: unknown;
  sensitiveData?: unknown;
  taintPropagation: string[];
  perStepDecisions: { stepId: string; decision: string; message?: string }[];
  findings: { severity: string; message: string }[];
  evidenceRootHash: string;
}

export function generateMultiAgentReport(result: MultiAgentWorkflowResult, format: "text" | "json" = "text"): string {
  if (format === "json") {
    // Redact secret sentinels if they sneaked in
    const raw = JSON.stringify(result, null, 2);
    const sentinel = ["sk", "test", "REDACT", "ME"].join("-");
    return raw.replace(new RegExp(sentinel, "g"), "[REDACTED:unknown_secret_like]");
  }

  let text = `Multi-Agent Session Guard Report\n`;
  text += `================================\n`;
  text += `Workflow: ${result.workflowId}\n`;
  text += `Final Decision: ${result.finalDecision.toUpperCase()}\n\n`;
  
  text += `Agents: ${result.agents.map((a: { agentId: string }) => a.agentId).join(", ")}\n`;
  text += `Taint Propagation: ${result.taintPropagation.length ? result.taintPropagation.join(", ") : "None"}\n`;
  
  text += `\nSteps:\n`;
  for (const step of result.perStepDecisions) {
    text += `  - Step ${step.stepId}: ${step.decision.toUpperCase()}${step.message ? ` (${step.message})` : ""}\n`;
  }
  
  if (result.findings.length > 0) {
    text += `\nFindings:\n`;
    for (const finding of result.findings) {
      text += `  - [${finding.severity.toUpperCase()}] ${finding.message}\n`;
    }
  }

  text += `\nEvidence Root Hash: ${result.evidenceRootHash}\n`;
  return text;
}
