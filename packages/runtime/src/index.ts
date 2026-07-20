import { failClosed, type PolicyEvaluation } from "@agentshield/core";

export * from "./context/runtimeContext.js";
export * from "./evidence/evidenceTraceRecorder.js";
export * from "./execution/executionBroker.js";
export * from "./attackGraph/actionToGraphNode.js";
export * from "./approval/runtimeApprovalIntegration.js";
export * from "./approval/runtimeApprovalStore.js";
export * from "./attackGraph/attackGraph.js";
export * from "./attackGraph/attackGraphEngine.js";
export * from "./attackGraph/attackGraphTypes.js";
export * from "./attackGraph/inferGraphEdges.js";
export * from "./attackGraph/riskPatterns.js";
export * from "./fingerprint/inMemoryFingerprintStore.js";
export * from "./capabilities/runtimeCapabilityContext.js";
export * from "./invariants/runtimeInvariants.js";
export * from "./processor/actionProcessor.js";
export * from "./registry/runtimeRegistryIntegration.js";
export * from "./sandbox/runtimeSandboxEvaluator.js";
export * from "./trace/inMemoryTraceRecorder.js";
export * from "./taint/runtimeTaintStore.js";

export interface RuntimeAction {
  id: string;
  type: string;
}

export function evaluateAction(action: RuntimeAction): PolicyEvaluation {
  if (action.id.length === 0 || action.type.length === 0) {
    return failClosed("action id and type are required");
  }

  return failClosed("no policy engine configured");
}
