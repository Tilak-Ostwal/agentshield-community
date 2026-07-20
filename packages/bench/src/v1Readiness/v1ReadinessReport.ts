import { V1ReadinessReport } from "./v1ReadinessSchema.js";
import { GapClosurePlanItem } from "./gapClosurePlanner.js";

export function generateV1MarkdownReport(report: V1ReadinessReport): string {
  let md = `# AgentShield v1.0 Readiness Report\n\n`;
  md += `**Status**: ${report.status}\n`;
  md += `**Score**: ${report.score.value}/${report.score.max} (${report.score.grade})\n\n`;

  md += `## Limitations\n`;
  for (const lim of report.limitations) {
    md += `- ${lim}\n`;
  }
  md += `\n`;

  md += `## Blockers\n`;
  if (report.releaseBlockers.length === 0) {
    md += `None.\n\n`;
  } else {
    for (const blocker of report.releaseBlockers) {
      md += `- **[${blocker.severity.toUpperCase()}]** ${blocker.description}\n`;
    }
    md += `\n`;
  }

  md += `## Production Boundary\n`;
  md += `- **v1 Ready**: ${report.productionBoundary.v1Ready.length} domains\n`;
  md += `- **Beta Ready**: ${report.productionBoundary.betaReady.length} domains\n`;
  md += `- **Mock Only**: ${report.productionBoundary.mockOnly.length} domains\n`;
  md += `- **Future Work**: ${report.productionBoundary.futureProductionWork.length} domains\n\n`;

  md += `## Domains\n`;
  for (const domain of report.domains) {
    md += `### ${domain.name}\n`;
    md += `- **Maturity**: ${domain.maturity}\n`;
    md += `- **Status**: ${domain.status}\n`;
  }

  md += `\n## Gaps\n`;
  for (const gap of report.gapClosurePlan) {
    md += `- ${gap.title}\n`;
  }

  return md;
}

export function generateGapClosureMarkdown(plan: GapClosurePlanItem[]): string {
  let md = `# AgentShield v1.0 Gap Closure Plan\n\n`;
  for (const item of plan) {
    md += `## ${item.title}\n`;
    md += `- **Domain**: ${item.domain}\n`;
    md += `- **Severity**: ${item.severity}\n`;
    md += `- **Phase**: ${item.recommendedPhase}\n`;
    md += `- **Action**: ${item.action}\n\n`;
  }
  return md;
}
