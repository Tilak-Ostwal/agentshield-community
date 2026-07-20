import { existsSync, readFileSync } from "node:fs";
import { isAbsolute, resolve } from "node:path";

import { validateWorkspaceConfigFile, type WorkspaceValidationFinding, parsePolicyBundle, verifyPolicyBundle } from "@agentshield/core";
import { parseRegistryBundle, verifyRegistryBundle } from "@agentshield/registry";
import { getPolicyPack } from "@agentshield/bench";

export type WorkspaceDoctorStatus = "pass" | "fail";

export interface WorkspaceDoctorCheck {
  id: string;
  status: WorkspaceDoctorStatus;
  message: string;
}

export interface WorkspaceDoctorReport {
  ok: boolean;
  validationFindings: WorkspaceValidationFinding[];
  checks: WorkspaceDoctorCheck[];
}

const requiredDocs = ["docs/workspace-config.md", "docs/project-status.md", "docs/security-review-checklist.md", "docs/known-limitations.md"];
const requiredExamples = ["examples/workspace/agentshield.workspace.json", "examples/workspace/README.md"];
const requiredCliCommands = ["workspace init", "workspace validate", "workspace doctor"];

function push(checks: WorkspaceDoctorCheck[], id: string, ok: boolean, pass: string, fail: string): void {
  checks.push({ id, status: ok ? "pass" : "fail", message: ok ? pass : fail });
}

function resolveFromCwd(cwd: string, path: string): string {
  return isAbsolute(path) ? path : resolve(cwd, path);
}

export function runWorkspaceDoctor(configPath: string, cwd = process.cwd()): WorkspaceDoctorReport {
  const checks: WorkspaceDoctorCheck[] = [];
  const resolvedConfigPath = resolveFromCwd(cwd, configPath);
  const validation = validateWorkspaceConfigFile(resolvedConfigPath, cwd);

  push(checks, "workspace.config.valid", validation.ok, "workspace config validates", "workspace config has blocking validation findings");

  if (validation.config?.recipe) {
    const recipe = validation.config.recipe;
    const warnings: string[] = [];
    if (!validation.config.policyBundlePath) warnings.push("Recipe specified but workspace lacks policyBundlePath");
    if (!validation.config.registryBundlePath) warnings.push("Recipe specified but workspace lacks registryBundlePath");
    if (!validation.config.auditor?.enabled) warnings.push("Recipe specified but workspace lacks auditor config");

    push(
      checks,
      "workspace.recipe.configured",
      warnings.length === 0,
      `recipe ${recipe} is configured`,
      `recipe ${recipe} issues: ${warnings.join(", ")}`
    );
  }

  if (validation.config?.registryBundlePath) {
    try {
      const p = resolve(cwd, validation.config.registryBundlePath);
      const b = parseRegistryBundle(JSON.parse(readFileSync(p, "utf-8")));
      const v = verifyRegistryBundle(b);
      push(checks, "workspace.registry-bundle.verified", v.valid, "registry bundle verified", v.failures.join(", "));
    } catch (e: any) {
      push(checks, "workspace.registry-bundle.verified", false, "registry bundle verified", `registry bundle parsing failed: ${e.message}`);
    }
  }

  if (validation.config?.auditor?.enabled) {
    push(checks, "workspace.auditor.readiness", true, "auditor evidence export is enabled and ready", "");
  }

  if (validation.config?.policyPack !== undefined) {
    try {
      const pack = getPolicyPack(validation.config.policyPack);
      push(
        checks,
        "workspace.policy-pack.configured",
        true,
        `policy pack ${pack.packId} is available (${pack.safetyLevel})`,
        `policy pack ${validation.config.policyPack} is unavailable`
      );
    } catch {
      push(
        checks,
        "workspace.policy-pack.configured",
        false,
        "policy pack is available",
        `policy pack ${validation.config.policyPack} is unavailable`
      );
    }
  } else {
    push(checks, "workspace.policy-pack.configured", true, "no policy pack configured", "policy pack check failed");
  }

  if (validation.config?.policyBundlePath !== undefined) {
    try {
      const bundleStr = readFileSync(resolveFromCwd(cwd, validation.config.policyBundlePath), "utf8");
      const bundle = parsePolicyBundle(JSON.parse(bundleStr));
      const res = verifyPolicyBundle(bundle);
      push(
        checks,
        "workspace.policy-bundle.verified",
        res.valid,
        `policy bundle ${bundle.bundleId} verified successfully`,
        `policy bundle verification failed: ${res.failures.join(", ")}`
      );
    } catch (e: any) {
      push(
        checks,
        "workspace.policy-bundle.verified",
        false,
        "policy bundle verified",
        `policy bundle parsing or load failed: ${e.message}`
      );
    }
  }

  for (const doc of requiredDocs) {
    push(checks, `workspace.docs.${doc}`, existsSync(resolve(cwd, doc)), `${doc} exists`, `${doc} is missing`);
  }

  for (const example of requiredExamples) {
    push(checks, `workspace.examples.${example}`, existsSync(resolve(cwd, example)), `${example} exists`, `${example} is missing`);
  }

  const cliSource = readFileSync(resolve(cwd, "packages", "cli", "src", "cli.ts"), "utf8");
  for (const command of requiredCliCommands) {
    push(
      checks,
      `workspace.cli.${command.replace(" ", ".")}`,
      cliSource.includes(command),
      `agentshield ${command} is documented in CLI help`,
      `agentshield ${command} is missing from CLI help`
    );
  }

  const docsAndExamples = [...requiredDocs, ...requiredExamples, configPath].filter((path) => existsSync(resolveFromCwd(cwd, path)));
  const sentinel = ["sk", "test", "REDACT", "ME"].join("-");
  const offenders = docsAndExamples.filter((path) => readFileSync(resolveFromCwd(cwd, path), "utf8").includes(sentinel));
  push(
    checks,
    "workspace.no-raw-fake-secret",
    offenders.length === 0,
    "workspace config, docs, and examples do not contain raw fake secret sentinel",
    `raw fake secret sentinel appears in ${offenders.join(", ")}`
  );

  const sortedChecks = checks.sort((left, right) => left.id.localeCompare(right.id));
  return {
    ok: validation.ok && sortedChecks.every((check) => check.status === "pass"),
    validationFindings: validation.findings,
    checks: sortedChecks
  };
}
