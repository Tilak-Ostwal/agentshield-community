import { type PolicyV2EvaluationContext } from "@agentshield/core";
import { type FrameworkWorkflow } from "./frameworkWorkflowSchema.js";
import { executeFrameworkToolWrapper, type FrameworkToolResult } from "./frameworkToolWrapper.js";

export interface FrameworkWorkflowResult {
  version: 1;
  workflowId: string;
  finalDecision: "allow" | "deny" | "review";
  steps: FrameworkToolResult[];
  attackGraphPatterns: string[];
  sensitiveDataDetected: boolean;
  evidenceRootHash: string;
}

export function runFrameworkWorkflow(
  workflow: FrameworkWorkflow,
  policyInput: unknown,
  execMap: Record<string, (input: unknown) => unknown>
): FrameworkWorkflowResult {
  const context: PolicyV2EvaluationContext = {
    capabilities: [],
    taintLabels: [],
    attackGraphPatterns: [],
    resources: []
  };

  const steps: FrameworkToolResult[] = [];
  let finalDecision: "allow" | "deny" | "review" = "allow";
  let sensitiveDetected = false;

  for (const step of workflow.steps) {
    if (finalDecision !== "allow") {
      const skippedResult: FrameworkToolResult = {
        version: 1,
        runnableId: step.stepId,
        toolName: step.toolName,
        decision: finalDecision,
        executed: false,
        blocked: true,
        reason: `Blocked by previous step decision: ${finalDecision}`,
        safeOutput: null,
        redactions: []
      };
      steps.push(skippedResult);
      continue;
    }

    const runnable = {
      version: 1 as const,
      runnableId: step.stepId,
      toolName: step.toolName,
      input: step.input
    };

    const fn = execMap[step.toolName] ?? (() => null);

    const result = executeFrameworkToolWrapper(runnable, policyInput, context, () => fn(step.input));
    steps.push(result);

    if (result.redactions.length > 0) {
      sensitiveDetected = true;
      if (!context.taintLabels!.includes("secret")) {
        context.taintLabels!.push("secret");
      }
    }
    
    // Simple mock attack graph detection for demo
    if (result.toolName.startsWith("network.") && sensitiveDetected) {
       context.attackGraphPatterns!.push("secret_to_network");
    }

    if (result.decision !== "allow") {
      finalDecision = result.decision;
    }
  }

  const evidenceRootHash = `sha256:fw-${Date.now()}`;

  return {
    version: 1,
    workflowId: workflow.workflowId,
    finalDecision,
    steps,
    attackGraphPatterns: context.attackGraphPatterns ?? [],
    sensitiveDataDetected: sensitiveDetected,
    evidenceRootHash
  };
}
