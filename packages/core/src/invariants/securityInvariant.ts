export interface SecurityInvariant {
  id: string;
  description: string;
}

export const SECURITY_INVARIANTS: SecurityInvariant[] = [
  { id: "invalid-input-denies", description: "Invalid input must never produce allow." },
  { id: "missing-policy-denies", description: "Missing policy must deny." },
  { id: "unknown-tool-denies", description: "Unknown tool must deny unless explicitly allowed." },
  { id: "execute-after-allow", description: "Tool execution must never happen before policy allow." },
  { id: "human-review-blocks-execution", description: "require_human_review must never execute tool." },
  { id: "deny-blocks-execution", description: "deny must never execute tool." },
  { id: "trace-no-raw-secrets", description: "Raw secrets must never appear in stored traces." },
  { id: "adapter-no-raw-secrets", description: "Raw secrets must never appear in adapter responses." },
  { id: "runtime-trace-ids", description: "Every processed action must produce trace_id and event_ids." },
  { id: "policy-decision-shape", description: "Every policy decision must include decision, ruleId, and reason." },
  { id: "fingerprint-change-review", description: "Changed fingerprint must not silently allow." },
  { id: "write-then-exec-review", description: "write-then-exec risk must not silently allow." },
  { id: "llm-advisory-nonauthoritative", description: "LLM advisory fields must never override deterministic policy." },
  { id: "redact-before-persist", description: "Trace data must be redacted before persistence." },
  { id: "runtime-errors-fail-closed", description: "Runtime errors must fail closed." }
];
