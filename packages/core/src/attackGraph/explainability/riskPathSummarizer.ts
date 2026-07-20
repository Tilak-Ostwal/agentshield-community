import { RawAttackGraph } from "./explainAttackGraph.js";
import { RiskPathStep } from "./attackGraphExplanation.js";

export function summarizeRiskPath(_graph: RawAttackGraph, chain: any[]): RiskPathStep[] {
  return chain.map((c, i) => {
    let role = "unknown";
    if (c.toolName.includes("read") || c.toolName.includes("document")) role = "untrusted_source";
    if (c.toolName.includes("secret") || (c.toolName.includes("fs") && c.toolName.includes("read"))) role = "sensitive_read";
    if (c.toolName.includes("network")) role = "external_sink";
    if (c.toolName.includes("write")) role = "file_write";
    if (c.toolName.includes("exec")) role = "code_execution";

    let explanation = `The agent used ${c.toolName}.`;
    if (role === "untrusted_source") explanation = "The agent read untrusted content that contained instructions.";
    else if (role === "sensitive_read") explanation = "The agent attempted to read a sensitive file.";
    else if (role === "external_sink") explanation = "The agent attempted to send sensitive data externally.";
    else if (c.decision === "deny") explanation += " This action was denied.";

    return {
      step: i + 1,
      nodeId: c.nodeId,
      toolName: c.toolName,
      role,
      explanation
    };
  });
}
