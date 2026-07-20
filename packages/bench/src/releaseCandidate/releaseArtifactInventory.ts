import { resolve } from "node:path";
import { existsSync } from "node:fs";

export function checkArtifactInventory(cwd: string): { ok: boolean; missing: string[] } {
  const required = [
    "docs/beta-release-candidate-gate.md",
    "docs/release-process.md",
    "examples/release-candidate/README.md"
  ];
  
  const missing: string[] = [];
  for (const req of required) {
    if (!existsSync(resolve(cwd, req))) {
      missing.push(req);
    }
  }
  
  return { ok: missing.length === 0, missing };
}
