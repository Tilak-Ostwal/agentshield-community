import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { checkHygiene } from "./publicRcHygiene.js";
import { checkClaims } from "./publicRcClaimsScanner.js";

export interface GateResult {
  ok: boolean;
  errors: string[];
}

export function evaluatePublicRcGate(workspaceRoot: string): GateResult {
  const errors: string[] = [];

  const requiredFiles = [
    "SECURITY.md",
    "CONTRIBUTING.md",
    "CODE_OF_CONDUCT.md",
    "docs/known-limitations.md",
    "docs/security-claims-boundary.md",
    "docs/advanced-public-release-candidate.md",
    "docs/public-evaluation-guide.md",
    "docs/final-launch-checklist.md"
  ];

  for (const file of requiredFiles) {
    if (!existsSync(join(workspaceRoot, file))) {
      errors.push(`Missing required file: ${file}`);
    }
  }

  // claims
  const claimsResult = checkClaims(workspaceRoot);
  if (!claimsResult.ok) {
    errors.push(...claimsResult.errors);
  }

  // fake secret
  const sentinel = ["sk", "test", "REDACT", "ME"].join("-");
  try {
    const rm = readFileSync(join(workspaceRoot, "README.md"), "utf8");
    if (rm.includes(sentinel)) {
      errors.push("Raw fake secret sentinel found");
    }
  } catch(e) {}

  // hygiene
  const hygiene = checkHygiene(workspaceRoot);
  if (hygiene.generatedFilesRemaining.length > 0) {
    errors.push(`Generated smoke file left at repo root: ${hygiene.generatedFilesRemaining.join(", ")}`);
  }

  return {
    ok: errors.length === 0,
    errors
  };
}
