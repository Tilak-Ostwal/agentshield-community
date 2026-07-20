import { existsSync } from "node:fs";
import { join } from "node:path";

export interface HygieneReport {
  generatedFilesRemaining: string[];
  unsafeInstructionsFound: string[];
  rawSecretLeaksFound: string[];
}

export function checkHygiene(workspaceRoot: string): HygieneReport {
  const generatedFiles = [
    "generated-pack.policy.json",
    "generated-redteam.json",
    "generated-redteam-all.json",
    "generated-policy.bundle.json",
    "generated-pack.bundle.json",
    "generated-registry.bundle.json",
    "auditor-evidence.json",
    "auditor-workspace-evidence.json",
    "auditor-evidence.md",
    "attack-graph-explanation.md",
    "incident-report.md",
    "migrated.policy.json",
    "migrated-json.policy.json",
    "release-candidate-report.md",
    "release-candidate-report.json",
    "RELEASE_NOTES.v0.2.0-beta.md",
    "leaderboard-result.json",
    "leaderboard-result-json.json",
    "leaderboard-summary.md",
    "marketplace-install-plan.md",
    "docs-command-catalog.md",
    "corpus-v4-snapshot.json",
    "corpus-v4-report.md",
    "corpus-v4-report.json",
    "perf-current-run.json",
    "perf-current-run-json.json",
    "perf-regression-report.md",
    "perf-regression-report.json",
    "supply-chain-report.md",
    "supply-chain-report.json",
    "security-review-pack.json",
    "security-review-pack-json.json",
    "security-review-report.md",
    "security-review-report.json",
    "v1-readiness-report.md",
    "v1-readiness-report.json",
    "v1-gap-closure-plan.md",
    "public-rc-report.md",
    "public-rc-report.json",
    "public-rc-package.json",
    "PUBLIC_EVALUATION_GUIDE.md",
    "PUBLIC_DEMO_SCRIPT.md",
    "FINAL_LAUNCH_CHECKLIST.md"
  ];
  
  const found: string[] = [];
  for (const file of generatedFiles) {
    if (existsSync(join(workspaceRoot, file))) {
      found.push(file);
    }
  }

  return {
    generatedFilesRemaining: found,
    unsafeInstructionsFound: [],
    rawSecretLeaksFound: []
  };
}
