export const REQUIRED_EVIDENCE_FILES = [
  "README.md",
  "SECURITY.md",
  "CONTRIBUTING.md",
  "CODE_OF_CONDUCT.md",
  "docs/project-status.md",
  "docs/known-limitations.md",
  "docs/security-review-checklist.md",
  "docs/security-claims-boundary.md",
  "docs/v1-readiness-report.md",
  "docs-site/agentshield.docs-manifest.json",
  "docs-site/navigation.json"
];

export function checkEvidenceCompleteness(workspaceFiles: string[]): { valid: boolean, missing: string[] } {
  const missing: string[] = [];
  const fileSet = new Set(workspaceFiles.map(f => f.replace(/\\/g, '/')));

  for (const required of REQUIRED_EVIDENCE_FILES) {
    if (!fileSet.has(required)) {
      missing.push(required);
    }
  }

  return {
    valid: missing.length === 0,
    missing
  };
}
