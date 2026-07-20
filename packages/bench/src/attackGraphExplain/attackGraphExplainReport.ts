import { AttackGraphExplanation } from "@agentshield/core";

export function formatAttackGraphExplanationMarkdown(expl: AttackGraphExplanation): string {
  let md = `# Attack Graph Explanation\n\n`;
  md += `**Category:** ${expl.category || "Unknown"}\n`;
  md += `**Severity:** ${expl.severity.toUpperCase()}\n`;
  md += `**Final Decision:** ${expl.finalDecision}\n\n`;
  md += `## Summary\n${expl.summary}\n\n`;
  
  md += `## Risk Path\n`;
  for (const step of expl.riskPath) {
    md += `${step.step}. **${step.toolName}** (${step.role})\n`;
    md += `   - ${step.explanation}\n`;
  }
  md += `\n`;

  md += `## Policy & Evidence\n`;
  md += `- **Matched Rules:** ${expl.policy.matchedRules.join(", ") || "None"}\n`;
  md += `- **Decision Reason:** ${expl.policy.decisionReason}\n`;
  md += `- **Evidence Hash:** ${expl.evidence.evidenceRootHash}\n\n`;

  md += `## Fix Recommendations\n`;
  for (const rec of expl.recommendations) {
    md += `- **[${rec.priority.toUpperCase()}] ${rec.title}**: ${rec.details}\n`;
  }
  
  return md;
}
