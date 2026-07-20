import { HygieneReport } from "./publicRcHygiene.js";

export interface PublicRcReport {
  version: 1;
  releaseId: string;
  status: "pass" | "warning" | "fail";
  score: {
    value: number;
    max: number;
    grade: "pass" | "warning" | "fail";
  };
  evidence: string[];
  capabilities: string[];
  blockers: string[];
  warnings: string[];
  limitations: string[];
  safeClaims: string[];
  forbiddenClaimsFound: string[];
  repositoryHygiene: HygieneReport;
  nextSteps: string[];
}

export function generatePublicRcMarkdown(report: PublicRcReport): string {
  return `# Public RC Report
**Status:** ${report.status}
**Score:** ${report.score.value}/${report.score.max}

## Evidence
${report.evidence.map(e => "- " + e).join("\n")}

## Capabilities
${report.capabilities.map(c => "- " + c).join("\n")}

## Limitations
${report.limitations.map(l => "- " + l).join("\n")}

## Blockers
${report.blockers.map(b => "- " + b).join("\n")}

## Next Steps
${report.nextSteps.map(n => "- " + n).join("\n")}
`;
}
