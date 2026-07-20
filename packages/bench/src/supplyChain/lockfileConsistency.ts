import * as fs from "fs";
import * as path from "path";

export function checkLockfileConsistency(workspaceRoot: string): { valid: boolean; error?: string } {
  const pnpmWorkspace = path.join(workspaceRoot, "pnpm-workspace.yaml");
  const pnpmLock = path.join(workspaceRoot, "pnpm-lock.yaml");
  
  if (fs.existsSync(pnpmWorkspace)) {
    if (!fs.existsSync(pnpmLock)) {
      return { valid: false, error: "pnpm-workspace.yaml exists but pnpm-lock.yaml is missing" };
    }
  }
  
  const packageJson = path.join(workspaceRoot, "package.json");
  if (!fs.existsSync(packageJson)) {
    return { valid: false, error: "root package.json is missing" };
  }
  
  return { valid: true };
}
