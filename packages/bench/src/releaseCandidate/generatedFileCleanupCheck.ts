import { existsSync } from "node:fs";
import { resolve } from "node:path";

export function checkGeneratedFileCleanup(cwd: string): { ok: boolean; leftoverFiles: string[] } {
  const generatedFiles = [
    "generated-pack.policy.json",
    "generated-redteam.json",
    "generated-redteam-all.json",
    "generated-policy.bundle.json",
    "generated-pack.bundle.json",
    "generated-registry.bundle.json",
    "auditor-workspace-evidence.json",
    "auditor-evidence.md",
    "attack-graph-explanation.md",
    "incident-report.md",
    "migrated.policy.json",
    "migrated-json.policy.json",
    "release-candidate-report.md",
    "release-candidate-report.json",
    "RELEASE_NOTES.v0.2.0-beta.md",
    "auditor-evidence.json"
  ];

  const leftoverFiles: string[] = [];
  for (const file of generatedFiles) {
    if (existsSync(resolve(cwd, file))) {
      leftoverFiles.push(file);
    }
  }

  return { ok: leftoverFiles.length === 0, leftoverFiles };
}
