import { SecurityReviewPack } from "./securityReviewPackSchema.js";
import { ReviewScope } from "./reviewScope.js";
import { EvidenceIndex } from "./evidenceIndex.js";
import { ReviewTestMatrix } from "./reviewTestMatrix.js";
import { InvariantCoverageMap } from "./invariantCoverageMap.js";
import { AuditFinding } from "./auditFindingSchema.js";
import { RemediationTracker } from "./remediationTracker.js";
import { createHash } from "node:crypto";

export interface SecurityReviewReport {
  pack: SecurityReviewPack;
  scope: ReviewScope;
  evidence: EvidenceIndex[];
  testMatrix: ReviewTestMatrix;
  invariantCoverage: InvariantCoverageMap;
  findings: AuditFinding[];
  remediation: RemediationTracker[];
}

export function generateSecurityReviewReport(report: SecurityReviewReport): string {
  const json = JSON.stringify(report, null, 2);
  const hash = createHash("sha256").update(json).digest("hex");
  return JSON.stringify({ ...report, reportHash: hash }, null, 2);
}
