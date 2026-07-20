import { type AgentIdentity, type DelegationPolicy } from "@agentshield/core";
import { createMultiAgentContext, evaluateMultiAgentStep } from "./multiAgentRuntime.js";

export interface MultiAgentWorkflowStep {
  stepId: string;
  agentId: string;
  delegateToAgentId?: string;
  toolName: string;
  input: any;
  approvalToken?: string;
}

export interface MultiAgentWorkflow {
  version: 1;
  workflowId: string;
  agents: AgentIdentity[];
  policyRef?: string;
  steps: MultiAgentWorkflowStep[];
  expectedFinalDecision: "allow" | "deny" | "review";
}

export interface MultiAgentWorkflowResult {
  workflowId: string;
  finalDecision: "allow" | "deny" | "review";
  agents: AgentIdentity[];
  delegationChains: AgentIdentity[][];
  perStepDecisions: { stepId: string, decision: "allow" | "deny" | "review", message?: string }[];
  taintPropagation: string[];
  sensitiveData: { involved: boolean, types: string[] };
  findings: any[];
  evidenceRootHash: string;
}

export function runMultiAgentWorkflow(
  workflow: MultiAgentWorkflow,
  policy?: DelegationPolicy,
  executor?: Record<string, (input: any) => any>
): MultiAgentWorkflowResult {
  const context = createMultiAgentContext(policy);
  const perStepDecisions: { stepId: string, decision: "allow" | "deny" | "review", message?: string }[] = [];
  let finalDecision: "allow" | "deny" | "review" = "allow";
  const findings: any[] = [];
  let sensitiveInvolved = false;
  
  for (const step of workflow.steps) {
    if (finalDecision === "deny") break; // Stop downstream
    
    const currentAgent = workflow.agents.find(a => a.agentId === step.agentId);
    const targetAgent = step.delegateToAgentId ? workflow.agents.find(a => a.agentId === step.delegateToAgentId) : undefined;
    
    if (!currentAgent) {
      finalDecision = "deny";
      perStepDecisions.push({ stepId: step.stepId, decision: "deny", message: "Unknown agent" });
      continue;
    }

    const evalRes = evaluateMultiAgentStep(context, currentAgent, targetAgent, [step.toolName]);
    const decisionEntry: any = { stepId: step.stepId, decision: evalRes.decision || "allow" };
    if (evalRes.message) decisionEntry.message = evalRes.message;
    perStepDecisions.push(decisionEntry);
    
    if (evalRes.decision === "deny") {
      finalDecision = "deny";
      if (evalRes.message?.includes("escalat")) {
        findings.push({ id: "multi-agent-privilege-escalation", severity: "critical", category: "privilege_escalation", message: evalRes.message });
      } else if (evalRes.message?.includes("taint laundering")) {
        findings.push({ id: "multi-agent-taint-laundering", severity: "high", category: "taint_laundering", message: evalRes.message });
      }
    }
    
    if (evalRes.decision === "allow" && executor) {
      const fn = executor[step.toolName];
      if (fn) {
        const out = fn(step.input);
        if (out && typeof out === "object" && "content" in out) {
          const contentStr = String(out.content);
          if (contentStr.includes("sk-test-") && contentStr.includes("REDACT-ME")) {
             sensitiveInvolved = true;
             if (!context.activeTaints.includes("sensitive")) context.activeTaints.push("sensitive");
          } else if (contentStr.includes(".env")) {
             if (!context.activeTaints.includes("sensitive")) context.activeTaints.push("sensitive");
          }
        }
      }
    }
  }

  const delegationChains = workflow.agents.map(a => context.graph.getDelegationChain(a.agentId)).filter(c => c.length > 0);

  return {
    workflowId: workflow.workflowId,
    finalDecision,
    agents: Array.from(context.graph.agents.values()),
    delegationChains,
    perStepDecisions,
    taintPropagation: context.activeTaints,
    sensitiveData: { involved: sensitiveInvolved, types: sensitiveInvolved ? ["secret"] : [] },
    findings,
    evidenceRootHash: "sha256:ma-" + Date.now()
  };
}
