import { AttackGraphExplanation, ExplanationCategory } from "./attackGraphExplanation.js";
import { reconstructDecisionChain } from "./decisionChain.js";
import { summarizeRiskPath } from "./riskPathSummarizer.js";
import { summarizeEvidenceReferences } from "./evidenceReferenceSummarizer.js";
import { generateFixRecommendations } from "./fixRecommendation.js";

export interface RawAttackGraph {
  nodes: Array<{
    id: string;
    toolName: string;
    actionType: string;
    decision: string;
    data?: any;
    error?: string;
  }>;
  edges: Array<{
    from: string;
    to: string;
    dataType: string;
  }>;
  metadata?: any;
}

export function explainAttackGraph(graph: RawAttackGraph): AttackGraphExplanation | { error: string } {
  try {
    if (!graph.nodes || !Array.isArray(graph.nodes)) {
      return { error: "malformed graph input: missing or invalid nodes array" };
    }

    const chain = reconstructDecisionChain(graph);
    const riskPath = summarizeRiskPath(graph, chain);
    const category = categorizeChain(chain, riskPath);
    const recommendations = generateFixRecommendations(category, riskPath);
    const evidence = summarizeEvidenceReferences(graph);

    let finalDecision: "allow" | "deny" | "require_human_review" | "require_human_approval" = "allow";
    if (graph.nodes.some(n => n.decision === "deny" || n.error)) {
      finalDecision = "deny";
    }

    let severity: "critical" | "high" | "medium" | "low" | "info" = "info";
    if (category === "secret_exfiltration_chain" || category === "write_then_execute_chain" || category === "sandbox_escape_attempt") {
      severity = "critical";
    } else if (category.includes("attempt") || category.includes("detected")) {
      severity = "high";
    }

    return {
      version: 1,
      explanationId: `graph-explanation-${Date.now()}`,
      category,
      summary: generateSummary(category),
      finalDecision,
      severity,
      riskPath,
      policy: {
        matchedRules: [],
        decisionReason: "Graph analysis matched " + category
      },
      registry: { toolTrustFindings: [] },
      sandbox: { sandboxFindings: [] },
      approval: { approvalFindings: [] },
      evidence,
      recommendations
    };
  } catch (err: any) {
    return { error: "malformed graph input: " + err.message };
  }
}

function categorizeChain(_chain: any[], riskPath: any[]): ExplanationCategory {
  const toolNames = riskPath.map(r => r.toolName);

  if (toolNames.some(t => t.includes("prompt")) && toolNames.some(t => t.includes("execute"))) return "prompt_injection_chain";
  if (toolNames.some(t => t.includes("secret") || t.includes("fs.read")) && toolNames.some(t => t.includes("network.post"))) return "secret_exfiltration_chain";
  if (toolNames.some(t => t.includes("write")) && toolNames.some(t => t.includes("exec"))) return "write_then_execute_chain";
  if (toolNames.some(t => t === "registry.modify")) return "registry_drift_chain";
  if (toolNames.some(t => t.includes("sandbox"))) return "sandbox_escape_attempt";
  if (toolNames.some(t => t.includes("approval"))) return "approval_bypass_attempt";
  if (toolNames.some(t => t.includes("tamper"))) return "evidence_tamper_detected";
  
  if (riskPath.filter(r => r.explanation.includes("denied")).length >= 3) return "repeated_denied_probe";

  return "unknown_chain";
}

function generateSummary(category: string): string {
  switch (category) {
    case "secret_exfiltration_chain": return "Untrusted content caused a secret read followed by an external network write.";
    case "prompt_injection_chain": return "Prompt injection led to unauthorized execution.";
    case "write_then_execute_chain": return "Agent wrote a file and then executed it.";
    case "registry_drift_chain": return "Agent attempted to modify registry trust boundaries.";
    case "sandbox_escape_attempt": return "Agent attempted to bypass sandbox restrictions.";
    case "approval_bypass_attempt": return "Agent attempted to bypass human approval.";
    case "evidence_tamper_detected": return "Agent attempted to tamper with evidence traces.";
    case "repeated_denied_probe": return "Agent repeatedly probed denied tools.";
    default: return "Multi-step agent chain analyzed.";
  }
}
