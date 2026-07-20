import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { defaultPublicRcManifest } from "./publicRcManifest.js";

export function checkClaims(workspaceRoot: string): { ok: boolean; errors: string[] } {
  const errors: string[] = [];
  const readme = join(workspaceRoot, "README.md");
  
  if (existsSync(readme)) {
    const content = readFileSync(readme, "utf8");
    for (const claim of defaultPublicRcManifest.forbiddenClaims) {
      if (content.includes(claim)) {
        errors.push(`Forbidden claim found: ${claim}`);
      }
    }
  }

  return {
    ok: errors.length === 0,
    errors
  };
}
