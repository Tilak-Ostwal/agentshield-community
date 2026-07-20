import { DocsManifest } from "./docsManifestSchema.js";

export const REQUIRED_FEATURES = [
  "core-runtime", "policy-v1-v2", "policy-migration", "policy-pack", "policy-marketplace",
  "policy-bundle", "registry", "registry-bundle", "evidence-trace", "auditor-export",
  "security-fuzz", "redteam-generator", "benchmark-corpus", "leaderboard-format",
  "sensitive-data-detection", "attack-graph", "attack-graph-explainability", "incident-reports",
  "workspace-config", "enterprise-recipes", "provider-adapter", "framework-adapter",
  "multi-agent-guard", "ide-integration", "consumer-harness", "governance", "release-candidate-gate"
];

export function mapDocsFeatureCoverage(manifest: DocsManifest) {
  const covered = new Set<string>();
  
  for (const page of manifest.pages) {
    for (const feat of (page.featuresCovered || [])) {
      covered.add(feat);
    }
  }

  const missing = REQUIRED_FEATURES.filter(f => !covered.has(f));
  
  return {
    valid: missing.length === 0,
    missing,
    covered: Array.from(covered)
  };
}
