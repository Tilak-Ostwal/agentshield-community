import { ReleaseCandidateManifest } from "./releaseCandidateManifest.js";

export function generateReleaseNotes(manifest: ReleaseCandidateManifest): string {
  let md = `# Release Notes: ${manifest.name}\n\n`;
  md += `**Release ID:** ${manifest.releaseId}\n`;
  md += `**Date:** ${manifest.createdAt}\n\n`;

  md += `## Phase 0–45 Capability Summary\n`;
  md += `AgentShield Veritas now includes advanced local, deterministic security features:\n`;
  md += `- Fail-closed architecture and deterministic runtime execution.\n`;
  md += `- Action interceptors, mock sandbox environments, and execution broker.\n`;
  md += `- MCP Proxy integration and custom adapters.\n`;
  md += `- Tamper-evident trace hashing, signed policy bundles, and registry trust bundles.\n`;
  md += `- Security Fuzzing, Red-Team coverage, and Auditor Evidence Packs.\n`;
  md += `- Runtime Incident Reporting and Attack Graph Explainability.\n`;
  md += `- Enterprise Integration Recipes.\n\n`;

  md += `## Known Limitations\n`;
  md += `- Relies on local execution constraints and does not use real sandboxing techniques (e.g. Docker, VMs).\n`;
  md += `- Fake secrets are used for deterministic mock tests.\n`;
  md += `- Policy engines and models are fully offline.\n\n`;

  md += `## Legal Disclaimer\n`;
  md += `> **DISCLAIMER:** AgentShield provides local deterministic checks only. This tool is NOT a legal compliance certification. It does not confer SOC2, ISO, HIPAA, or PCI compliance. Use at your own risk.\n\n`;

  return md;
}
