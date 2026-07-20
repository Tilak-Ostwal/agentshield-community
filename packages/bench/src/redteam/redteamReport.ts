import type { RedteamCoverageReport } from "./redteamCoverage.js";
import type { RedteamTemplate } from "./redteamTemplateSchema.js";

export function generateRedteamTemplateListText(templates: RedteamTemplate[]): string {
  return ["AgentShield red-team templates", ...templates.map((template) => `${template.templateId} - ${template.category} - ${template.severity} - ${template.description}`)].join("\n");
}

export function generateRedteamCoverageText(report: RedteamCoverageReport): string {
  return [
    `AgentShield red-team coverage: ${report.passed ? "PASS" : "WARN"}`,
    `Scenarios: ${report.totalScenarios}`,
    `Critical coverage: ${report.criticalCoverage}%`,
    `High+critical coverage: ${report.highCoverage}%`,
    `Missing recommended categories: ${report.missingRecommendedCategories.length === 0 ? "none" : report.missingRecommendedCategories.join(", ")}`,
    "Categories:",
    ...Object.entries(report.byCategory).sort(([left], [right]) => left.localeCompare(right)).map(([category, count]) => `- ${category}: ${count}`),
    "Severities:",
    ...Object.entries(report.bySeverity).sort(([left], [right]) => left.localeCompare(right)).map(([severity, count]) => `- ${severity}: ${count}`)
  ].join("\n");
}

export function generateRedteamCoverageMarkdown(report: RedteamCoverageReport): string {
  return [
    "# AgentShield Red-Team Coverage",
    "",
    `Status: ${report.passed ? "PASS" : "WARN"}`,
    `Total scenarios: ${report.totalScenarios}`,
    `Critical coverage: ${report.criticalCoverage}%`,
    `High+critical coverage: ${report.highCoverage}%`,
    "",
    "## Categories",
    "",
    "| Category | Count |",
    "| --- | ---: |",
    ...Object.entries(report.byCategory).sort(([left], [right]) => left.localeCompare(right)).map(([category, count]) => `| ${category} | ${count} |`),
    "",
    "## Severities",
    "",
    "| Severity | Count |",
    "| --- | ---: |",
    ...Object.entries(report.bySeverity).sort(([left], [right]) => left.localeCompare(right)).map(([severity, count]) => `| ${severity} | ${count} |`)
  ].join("\n");
}

export function generateRedteamCoverageJson(report: RedteamCoverageReport): string {
  return JSON.stringify(report, null, 2);
}
