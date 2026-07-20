import { z } from "zod";

export const auditFindingSchema = z.object({
  id: z.string(),
  severity: z.enum(["low", "medium", "high", "critical"]),
  description: z.string(),
  reproduction: z.string(),
  remediation: z.string(),
});

export type AuditFinding = z.infer<typeof auditFindingSchema>;

export function parseAuditFinding(data: unknown): AuditFinding {
  return auditFindingSchema.parse(data);
}
