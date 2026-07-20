import { MarketplaceEntry } from "./marketplaceEntrySchema.js";

export function generateMarketplaceInstallPlan(entry: MarketplaceEntry): string {
  let md = `# Install Plan: ${entry.name}\n\n`;
  md += `**Entry ID**: ${entry.entryId}\n`;
  md += `**Pack ID**: ${entry.packId}\n\n`;
  
  md += `AgentShield does not automatically install or trust marketplace policies. To adopt this policy pack safely, follow these steps:\n\n`;

  md += `### 1. Inspect the Policy Pack\n`;
  md += `Review the raw policy rules located at \`${entry.packPath}\`.\n\n`;

  md += `### 2. Audit the Policy\n`;
  md += `Run a local audit to ensure the policy matches your security posture:\n`;
  md += `\`\`\`bash\n`;
  md += `pnpm cli -- policy audit ${entry.packPath}\n`;
  md += `\`\`\`\n\n`;

  md += `### 3. Verify Trust Review\n`;
  md += `Generate the review report to understand the safety score and limitations:\n`;
  md += `\`\`\`bash\n`;
  md += `pnpm cli -- marketplace review examples/marketplace/entries/${entry.entryId}.marketplace.json\n`;
  md += `\`\`\`\n\n`;

  md += `### 4. Create a Policy Bundle\n`;
  md += `If you trust the policy, bundle it with your workspace configuration:\n`;
  md += `\`\`\`bash\n`;
  md += `pnpm cli -- policy bundle ${entry.packPath} --out my-workspace.bundle.json\n`;
  md += `\`\`\`\n\n`;

  md += `### 5. Update Workspace Config\n`;
  md += `Reference the bundle in your workspace profile.\n`;

  return md;
}
