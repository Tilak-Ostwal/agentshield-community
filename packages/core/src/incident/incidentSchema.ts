import { z } from "zod";

export const incidentCategorySchema = z.enum([
  "secret_exfiltration",
  "pii_export",
  "prompt_injection",
  "write_then_execute",
  "tool_abuse",
  "policy_bypass",
  "registry_drift",
  "blocked_tool",
  "sandbox_violation",
  "approval_bypass",
  "adapter_failure",
  "evidence_tamper",
  "sensitive_data_leak",
  "repeated_denied_probe",
  "runtime_fail_closed",
  "unknown"
]);

export const runtimeIncidentSchema = z.object({
  version: z.literal(1),
  incidentId: z.string(),
  createdAt: z.string(),
  title: z.string(),
  severity: z.enum(["critical", "high", "medium", "low", "info"]),
  status: z.enum(["blocked", "review_required", "allowed_with_warning", "failed_closed"]),
  category: incidentCategorySchema,
  summary: z.string(),
  finalDecision: z.enum(["deny", "allow", "require_human_review", "require_human_approval"]),
  affectedTools: z.array(z.string()),
  policy: z.object({
    matchedRules: z.array(z.string()),
    policyHash: z.string(),
    policyBundleVerified: z.boolean()
  }).optional(),
  registry: z.object({
    toolTrustFindings: z.array(z.string()),
    registryBundleVerified: z.boolean()
  }).optional(),
  sandbox: z.object({
    sandboxFindings: z.array(z.string())
  }).optional(),
  approval: z.object({
    approvalFindings: z.array(z.string())
  }).optional(),
  sensitiveData: z.object({
    involved: z.boolean(),
    types: z.array(z.string()),
    rawSecretLeakDetected: z.boolean()
  }).optional(),
  attackGraph: z.object({
    findings: z.array(z.string()),
    explanationId: z.string().optional()
  }).optional(),
  timeline: z.array(z.object({
    step: z.number(),
    timestamp: z.string(),
    eventType: z.string(),
    summary: z.string()
  })),
  evidence: z.object({
    evidenceRootHash: z.string(),
    traceVerified: z.boolean(),
    referencedEvents: z.array(z.string())
  }).optional(),
  remediation: z.array(z.object({
    priority: z.string(),
    title: z.string(),
    details: z.string()
  })),
  limitations: z.array(z.string()),
  incidentHash: z.string()
}).strict();

export type RuntimeIncident = z.infer<typeof runtimeIncidentSchema>;
export type IncidentCategory = z.infer<typeof incidentCategorySchema>;
