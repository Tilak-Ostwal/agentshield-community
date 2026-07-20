export function generateCommandCatalog() {
  const groups = [
    { name: "init/check/version/demo", example: "agentshield check agentshield.policy.json", purpose: "Basic local operations", docs: "getting-started" },
    { name: "bench/redteam/security-fuzz/perf", example: "agentshield bench --ci", purpose: "Security testing", docs: "redteam-and-benchmarks" },
    { name: "policy/policy-pack/policy-test/policy-audit/policy-bundle/policy-migration/marketplace", example: "agentshield policy-pack list", purpose: "Policy management", docs: "policy-system" },
    { name: "registry/registry-bundle", example: "agentshield registry validate", purpose: "Registry management", docs: "registry-trust" },
    { name: "workspace/doctor", example: "agentshield workspace init", purpose: "Workspace setup", docs: "getting-started" },
    { name: "adapter/provider-adapter/framework-adapter/multi-agent", example: "agentshield framework-adapter wrap", purpose: "Adapters & integrations", docs: "adapters" },
    { name: "auditor/incident/explain-graph/sensitive", example: "agentshield incident report", purpose: "Auditing and evidence", docs: "evidence-and-audit" },
    { name: "recipe/consumer/leaderboard/governance/release-candidate/ide/docs", example: "agentshield release-check", purpose: "Enterprise & Ecosystem", docs: "enterprise-recipes" }
  ];

  let md = "# AgentShield Command Catalog\n\n";
  for (const g of groups) {
    md += `## ${g.name}\n`;
    md += `- **Purpose**: ${g.purpose}\n`;
    md += `- **Example**: \`${g.example}\`\n`;
    md += `- **Docs**: [page](${g.docs}.md)\n\n`;
  }
  return md;
}
