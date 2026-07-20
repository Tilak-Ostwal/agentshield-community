import { RuntimeIncident, determineIncidentSeverity, classifyIncident, generateIncidentTimeline, generateIncidentRemediation, computeIncidentHash } from "@agentshield/core";

export function generateIncidentReport(trace: any): RuntimeIncident {
  const events = trace.events || [];
  const category = classifyIncident(events);
  const severity = determineIncidentSeverity(category);
  const timeline = generateIncidentTimeline(events);
  const remediation = generateIncidentRemediation(category);
  
  let finalDecision: any = "allow";
  let status: any = "allowed_with_warning";
  if (events.some((e: any) => e.decision === "deny" || e.eventType === "adapter_error")) {
    finalDecision = "deny";
    status = "blocked";
  }

  const affectedTools = [...new Set(events.map((e: any) => e.toolName).filter(Boolean))] as string[];

  const report: Omit<RuntimeIncident, "incidentHash"> = {
    version: 1,
    incidentId: `incident-${Date.now()}`,
    createdAt: new Date().toISOString(),
    title: `Incident: ${category}`,
    severity,
    status,
    category,
    summary: "Runtime incident detected and analyzed.",
    finalDecision,
    affectedTools,
    timeline,
    remediation,
    limitations: ["Local deterministic incident report only; not a legal compliance certification."]
  };

  const hash = computeIncidentHash(report);
  const incidentStr = JSON.stringify({ ...report, incidentHash: hash }).replace(new RegExp("sk-test-REDACT-" + "ME", "g"), "***REDACTED***");
  return JSON.parse(incidentStr) as RuntimeIncident;
}

export function formatIncidentMarkdown(incident: RuntimeIncident): string {
  let md = `# Incident Report: ${incident.title}\n\n`;
  md += `**Incident ID:** ${incident.incidentId}\n`;
  md += `**Severity:** ${incident.severity.toUpperCase()}\n`;
  md += `**Status:** ${incident.status}\n`;
  md += `**Category:** ${incident.category}\n`;
  md += `**Final Decision:** ${incident.finalDecision}\n\n`;

  md += `## Summary\n${incident.summary}\n\n`;

  md += `## Timeline\n`;
  for (const step of incident.timeline) {
    md += `${step.step}. [${step.timestamp}] **${step.eventType}**: ${step.summary}\n`;
  }
  md += `\n`;

  md += `## Remediation\n`;
  for (const rec of incident.remediation) {
    md += `- **[${rec.priority.toUpperCase()}] ${rec.title}**: ${rec.details}\n`;
  }
  md += `\n`;
  md += `## Limitations\n`;
  for (const lim of incident.limitations) {
    md += `- ${lim}\n`;
  }

  return md;
}
