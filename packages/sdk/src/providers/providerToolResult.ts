import { detectSensitive, redactSensitive } from "@agentshield/core";

export interface ProviderToolResult {
  version: 1;
  toolCallId: string;
  toolName: string;
  decision: "allow" | "review" | "deny";
  executed: boolean;
  blocked: boolean;
  reason: string;
  safeOutput: unknown;
  redactions: string[];
  evidenceRootHash?: string;
}

export function wrapToolResult(
  toolCallId: string,
  toolName: string,
  decision: "allow" | "review" | "deny",
  executed: boolean,
  reason: string,
  rawOutput: unknown,
  evidenceHash?: string
): ProviderToolResult {
  const result: ProviderToolResult = {
    version: 1,
    toolCallId,
    toolName,
    decision,
    executed,
    blocked: !executed,
    reason,
    safeOutput: null,
    redactions: [],
    ...(evidenceHash ? { evidenceRootHash: evidenceHash } : {})
  };

  if (!executed || rawOutput === undefined || rawOutput === null) {
    return result;
  }

  // Redact output
  const detections = detectSensitive(rawOutput);
  
  if (detections.length > 0) {
    result.safeOutput = redactSensitive(rawOutput);
    result.redactions = detections.map(d => d.type);
  } else {
    result.safeOutput = rawOutput;
  }

  return result;
}
