import { ReleaseCandidateManifest } from "./releaseCandidateManifest.js";
import { ReleaseReadinessScore } from "./releaseReadinessScore.js";

export interface GeneratedFileCleanupResult {
  ok: boolean;
  leftoverFiles: string[];
}

export function formatReleaseCandidateReportMarkdown(manifest: ReleaseCandidateManifest, score: ReleaseReadinessScore, cleanup: GeneratedFileCleanupResult, artifactMissing: string[], missingGates: string[]): string {
  let md = `# Release Candidate Report: ${manifest.releaseId}\n\n`;
  
  md += `**Name:** ${manifest.name}\n`;
  md += `**Maturity:** ${manifest.maturity.toUpperCase()}\n`;
  md += `**Date:** ${manifest.createdAt}\n\n`;

  md += `## Readiness Score\n`;
  md += `- **Score:** ${score.score} / 100\n`;
  md += `- **Grade:** ${score.grade.toUpperCase()}\n\n`;

  md += `## Gates\n`;
  if (missingGates.length === 0) {
    md += `All required gates passed.\n\n`;
  } else {
    md += `Missing Gates:\n- ${missingGates.join("\n- ")}\n\n`;
  }

  md += `## Evidence Artifacts\n`;
  if (manifest.evidenceArtifacts && manifest.evidenceArtifacts.length > 0) {
    md += `- ${manifest.evidenceArtifacts.join("\n- ")}\n\n`;
  } else {
    md += `None specified.\n\n`;
  }
  
  md += `## Artifact Inventory\n`;
  if (artifactMissing.length === 0) {
    md += `All required artifacts present.\n\n`;
  } else {
    md += `Missing Artifacts:\n- ${artifactMissing.join("\n- ")}\n\n`;
  }

  md += `## Generated File Cleanup\n`;
  if (cleanup.ok) {
    md += `Workspace is clean.\n\n`;
  } else {
    md += `Leftover files detected:\n- ${cleanup.leftoverFiles.join("\n- ")}\n\n`;
  }

  md += `## Limitations & Disclaimers\n`;
  md += `> **DISCLAIMER:** AgentShield provides local deterministic checks only. This report is NOT a legal compliance certification. It does not confer SOC2, ISO, HIPAA, or PCI compliance.\n\n`;
  
  md += `Known Limitations:\n`;
  md += `- The security guarantees rely on deterministic logic and fail-closed design, not external attestation.\n`;

  return md;
}

export function formatReleaseCandidateReportJson(manifest: ReleaseCandidateManifest, score: ReleaseReadinessScore, cleanup: GeneratedFileCleanupResult, artifactMissing: string[], missingGates: string[]): string {
  return JSON.stringify({
    manifest,
    score,
    cleanup,
    artifactMissing,
    missingGates,
    disclaimer: "AgentShield provides local deterministic checks only. This report is NOT a legal compliance certification."
  }, null, 2) + "\n";
}
