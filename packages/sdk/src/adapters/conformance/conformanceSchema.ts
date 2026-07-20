import { z } from "zod";

// ── Case types ──────────────────────────────────────────────────────────────

export const toolCallCaseSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    description: z.string().min(1),
    type: z.literal("tool_call"),
    toolCall: z
      .object({
        id: z.string().min(1),
        tool: z.string(),
        arguments: z.record(z.unknown()).default({})
      })
      .strict(),
    expected: z
      .object({
        decision: z.enum(["allow", "deny", "require_human_review", "invalid"]),
        forwarded: z.boolean(),
        executionStatus: z.enum(["executed", "blocked", "error"]),
        mustNotForward: z.boolean().optional(),
        mustRedactSecret: z.boolean().optional()
      })
      .strict()
  })
  .strict();

export type ToolCallCase = z.infer<typeof toolCallCaseSchema>;

export const registrationCaseSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    description: z.string().min(1),
    type: z.enum(["duplicate_registration", "invalid_metadata"]),
    expected: z
      .object({
        registrationFails: z.literal(true)
      })
      .strict()
  })
  .strict();

export type RegistrationCase = z.infer<typeof registrationCaseSchema>;

export const adapterConformanceCaseSchema = z.discriminatedUnion("type", [
  toolCallCaseSchema,
  registrationCaseSchema
]);

export type AdapterConformanceCase = z.infer<typeof adapterConformanceCaseSchema>;

// ── Suite ────────────────────────────────────────────────────────────────────

export const adapterConformanceSuiteSchema = z
  .object({
    adapterId: z.string().min(1),
    suiteName: z.string().min(1),
    description: z.string().min(1),
    policyPath: z.string().min(1).optional(),
    cases: z.array(adapterConformanceCaseSchema).min(1)
  })
  .strict();

export type AdapterConformanceSuite = z.infer<typeof adapterConformanceSuiteSchema>;

export function parseAdapterConformanceSuite(raw: unknown): AdapterConformanceSuite {
  return adapterConformanceSuiteSchema.parse(raw);
}

// ── Result types ─────────────────────────────────────────────────────────────

export type CertificationStatus = "pass" | "fail" | "passed_with_warnings";

export interface AdapterCertificationCaseResult {
  id: string;
  name: string;
  caseType: "tool_call" | "duplicate_registration" | "invalid_metadata";
  passed: boolean;
  decision?: string;
  forwarded?: boolean;
  executionStatus?: string;
  failures: string[];
  warnings: string[];
}

export interface AdapterCertificationResult {
  adapterId: string;
  adapterName: string;
  suiteName: string;
  certificationStatus: CertificationStatus;
  total: number;
  passed: number;
  failed: number;
  warnings: number;
  cases: AdapterCertificationCaseResult[];
  certificationFailures: string[];
}
