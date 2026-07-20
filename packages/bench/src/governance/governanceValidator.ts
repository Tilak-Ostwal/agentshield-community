import { GovernanceRecord, GovernanceRecordSchema } from "./governanceRecordSchema.js";
import { checkSubmissionSafety } from "./submissionSafety.js";

export function validateGovernanceRecord(recordRaw: unknown): { valid: boolean; errors: string[]; record?: GovernanceRecord } {
  const parsed = GovernanceRecordSchema.safeParse(recordRaw);
  if (!parsed.success) {
    return { valid: false, errors: parsed.error.errors.map(e => e.message) };
  }
  const record = parsed.data;
  const errors: string[] = [];

  const violations = checkSubmissionSafety(JSON.stringify(recordRaw), record.type);
  if (violations.length > 0) {
    errors.push(...violations.map(v => `Safety violation (${v.rule}): ${v.detail}`));
  }
  
  if (record.decision.limitations.length === 0) {
    errors.push("Limitations array cannot be empty.");
  }

  return { valid: errors.length === 0, errors, record };
}
