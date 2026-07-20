import * as fs from "fs";
import * as path from "path";
import { PackageIntegrityConfig } from "./packageIntegritySchema.js";
import { validateExportMap } from "./exportMapValidator.js";
import { checkPackageFilesAllowlist } from "./packageFilesAllowlist.js";
import { checkLockfileConsistency } from "./lockfileConsistency.js";
import { scanForUnsafePatterns } from "./cliSafetyScanner.js";
import { scanDistributableSecrets } from "./distributableSecretScanner.js";
import { generateBuildArtifactInventory } from "./buildArtifactInventory.js";

export interface SupplyChainReport {
  version: 1;
  status: "pass" | "warning" | "fail";
  criticalFailures: number;
  warnings: number;
  checks: any[];
  packageSummaries: any[];
  artifactInventory: any[];
  limitations: string[];
}

export function generateSupplyChainReport(config: PackageIntegrityConfig, workspaceRoot: string): SupplyChainReport {
  const report: SupplyChainReport = {
    version: 1,
    status: "pass",
    criticalFailures: 0,
    warnings: 0,
    checks: [],
    packageSummaries: [],
    artifactInventory: [],
    limitations: config.limitations || []
  };

  const addCheck = (id: string, valid: boolean, message: string) => {
    report.checks.push({
      checkId: id,
      status: valid ? "pass" : "fail",
      severity: "critical",
      message
    });
    if (!valid) report.criticalFailures++;
  };

  // 1. Lockfile consistency
  const lockfileRes = checkLockfileConsistency(workspaceRoot);
  addCheck("lockfile-consistency", lockfileRes.valid, lockfileRes.error || "Lockfile is consistent");

  // 2. Package manifest and exports
  for (const pkg of config.packages) {
    const pkgPath = path.join(workspaceRoot, pkg, "package.json");
    if (fs.existsSync(pkgPath)) {
      const expRes = validateExportMap(pkgPath);
      addCheck(`export-map-${pkg}`, expRes.valid, expRes.valid ? `Exports valid for ${pkg}` : `Invalid exports in ${pkg}: ${expRes.errors.join(", ")}`);
    } else {
      addCheck(`manifest-${pkg}`, false, `Missing package.json for ${pkg}`);
    }
  }

  // 3. Package files allowlist (generated files)
  const allowlistRes = checkPackageFilesAllowlist(workspaceRoot, config.generatedFilesDenylist);
  addCheck("generated-files-cleanup", allowlistRes.valid, allowlistRes.valid ? "No forbidden generated files found" : `Forbidden files found: ${allowlistRes.forbiddenFound.join(", ")}`);

  // 4. CLI Safety (Unsafe patterns)
  const safetyRes = scanForUnsafePatterns(workspaceRoot, config.forbiddenPatterns);
  addCheck("unsafe-commands-scan", safetyRes.valid, safetyRes.valid ? "No unsafe commands found" : `Unsafe patterns found: ${safetyRes.violations.join(", ")}`);

  // 5. Distributable Secrets
  const secretRes = scanDistributableSecrets(workspaceRoot);
  addCheck("distributable-secrets-scan", secretRes.valid, secretRes.valid ? "No leaked secrets found" : `Secrets leaked: ${secretRes.violations.join(", ")}`);

  // 6. Build Artifacts
  report.artifactInventory = generateBuildArtifactInventory(path.join(workspaceRoot, "packages", "cli", "dist"));

  report.status = report.criticalFailures > 0 ? "fail" : "pass";
  return report;
}

export function generateSupplyChainMarkdown(report: SupplyChainReport): string {
  let md = `# Supply Chain Integrity Report\n\n`;
  md += `Status: **${report.status.toUpperCase()}**\n`;
  md += `Critical Failures: ${report.criticalFailures}\n`;
  md += `Warnings: ${report.warnings}\n\n`;

  md += `## Checks\n\n`;
  for (const check of report.checks) {
    md += `- [${check.status.toUpperCase()}] **${check.checkId}**: ${check.message}\n`;
  }

  md += `\n## Limitations\n\n`;
  for (const limit of report.limitations) {
    md += `- ${limit}\n`;
  }

  return md;
}
