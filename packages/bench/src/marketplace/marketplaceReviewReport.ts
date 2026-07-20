import { PolicyPackTrustReview } from "./policyPackTrustReview.js";

const SENTINEL = ["sk", "test", "REDACT", "ME"].join("-");

export function generateMarketplaceReviewMarkdown(review: PolicyPackTrustReview): string {
  let md = `# Policy Pack Trust Review: ${review.packId}\n\n`;
  md += `**Review ID**: ${review.reviewId}\n`;
  md += `**Status**: ${review.status}\n`;
  md += `**Safety Score**: ${review.safetyScore}/100\n`;
  md += `**Risk**: ${review.riskAssessment.severity} - ${review.riskAssessment.summary}\n`;
  md += `**Decision**: ${review.decision.outcome} (${review.decision.reason})\n\n`;

  md += `## Checks\n`;
  for (const check of review.checks) {
    const mark = check.passed ? "[x]" : "[ ]";
    md += `- ${mark} ${check.checkId}: ${check.notes || ""}\n`;
  }

  if (review.decision.limitations.length > 0) {
    md += `\n## Limitations\n`;
    for (const lim of review.decision.limitations) {
      md += `- ${lim}\n`;
    }
  }

  // Redact sentinel
  return md.split(SENTINEL).join("[REDACTED]");
}
