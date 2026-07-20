import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { basename, join, relative } from "node:path";

import type { CliResult } from "../cli.js";

type DoctorStatus = "pass" | "fail";

interface DoctorCheck {
  id: string;
  status: DoctorStatus;
  message: string;
}

interface DoctorReport {
  ok: boolean;
  checks: DoctorCheck[];
}

const requiredDocs = [
  "README.md",
  "docs/project-status.md",
  "docs/security-review-checklist.md",
  "docs/known-limitations.md",
  "docs/adapter-conformance.md",
  "docs/release-readiness.md"
];

const requiredExamples = [
  "examples/end-to-end/README.md",
  "examples/policies/strict.policy.json",
  "examples/policy-tests/strict.policy-test.json",
  "examples/custom-adapter/adapter-conformance.json"
];

const generatedSmokeFiles = [
  "agentshield.sarif.json",
  "agentshield.workspace.json",
  "adapter-conformance-report.md",
  "approval-ticket.json",
  "approval-token.json",
  "bench-evidence.json",
  "ci-report.md",
  "demo-evidence.json",
  "generated.policy.json",
  "generated-redteam.json",
  "generated-redteam-all.json",
  "policy-test-snapshot.json",
  "report.html",
  "report.json",
  "report.md"
];

function readJson(path: string): Record<string, unknown> {
  return JSON.parse(readFileSync(path, "utf8")) as Record<string, unknown>;
}

function push(checks: DoctorCheck[], id: string, ok: boolean, pass: string, fail: string): void {
  checks.push({ id, status: ok ? "pass" : "fail", message: ok ? pass : fail });
}

function packageDirs(rootDir: string): string[] {
  const packagesDir = join(rootDir, "packages");
  if (!existsSync(packagesDir)) return [];

  return readdirSync(packagesDir)
    .map((entry) => join(packagesDir, entry))
    .filter((entry) => statSync(entry).isDirectory() && existsSync(join(entry, "package.json")))
    .sort((left, right) => left.localeCompare(right));
}

function scanFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];

  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name === ".git" || entry.name === "node_modules") return [];
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return scanFiles(path);
    if (entry.isFile()) return [path];
    return [];
  });
}

function normalizePath(path: string): string {
  return path.replaceAll("\\", "/");
}

function isApprovedSecretFixture(relativePath: string): boolean {
  const path = normalizePath(relativePath);
  return (
    path.includes(".test.") ||
    path.includes("/fixtures/") ||
    path.includes("/mock/") ||
    path === "examples/custom-adapter/adapter-conformance.json" ||
    path.startsWith("examples/policy-tests/") ||
    path === "examples/demo-agent/src/demoScenarios.ts" ||
    path === "examples/demo-agent/dist/demoScenarios.js" ||
    path === "examples/demo-agent/dist/demoScenarios.d.ts" ||
    path === "packages/mcp-adapter/src/conformance/goldenFixtures.ts" ||
    path.includes("/conformance/goldenFixtures.") ||
    path.startsWith("examples/sensitive/") ||
    path.startsWith("examples/provider-adapter/")
  );
}

function checkEnvironment(rootDir: string, checks: DoctorCheck[]): void {
  const rootManifest = readJson(join(rootDir, "package.json"));
  const packageManager = typeof rootManifest.packageManager === "string" ? rootManifest.packageManager : "";
  const major = Number.parseInt(process.versions.node.split(".")[0] ?? "0", 10);

  push(checks, "env.node", major >= 18, `Node ${process.version} is supported`, `Node ${process.version} is below the supported major version`);
  push(
    checks,
    "env.pnpm",
    packageManager.startsWith("pnpm@"),
    `${packageManager} is declared`,
    "root package.json must declare a pnpm packageManager"
  );
}

function checkBuildAvailability(rootDir: string, checks: DoctorCheck[]): void {
  const rootManifest = readJson(join(rootDir, "package.json"));
  const rootScripts = rootManifest.scripts as Record<string, unknown> | undefined;
  push(checks, "build.root-script", typeof rootScripts?.build === "string", "root build script exists", "root build script is missing");

  const missing = packageDirs(rootDir).filter((dir) => {
    const manifest = readJson(join(dir, "package.json"));
    const scripts = manifest.scripts as Record<string, unknown> | undefined;
    return typeof scripts?.build !== "string";
  });

  push(
    checks,
    "build.package-scripts",
    missing.length === 0,
    "package build scripts exist",
    `package build scripts missing in ${missing.map((dir) => basename(dir)).join(", ")}`
  );
}

function checkRequiredFiles(rootDir: string, checks: DoctorCheck[]): void {
  for (const doc of requiredDocs) {
    push(checks, `docs.${doc}`, existsSync(join(rootDir, doc)), `${doc} exists`, `${doc} is missing`);
  }

  for (const example of requiredExamples) {
    push(checks, `examples.${example}`, existsSync(join(rootDir, example)), `${example} exists`, `${example} is missing`);
  }
}

function checkGeneratedSmokeFiles(rootDir: string, checks: DoctorCheck[]): void {
  const present = generatedSmokeFiles.filter((file) => existsSync(join(rootDir, file)));
  push(
    checks,
    "repo.no-generated-smoke-files",
    present.length === 0,
    "no generated smoke files remain in the repository root",
    `generated smoke files remain in the repository root: ${present.join(", ")}`
  );
}

function checkSecretSentinel(rootDir: string, checks: DoctorCheck[]): void {
  const sentinel = ["sk", "test", "REDACT", "ME"].join("-");
  const offenders = scanFiles(rootDir)
    .map((file) => ({ file, relativePath: normalizePath(relative(rootDir, file)) }))
    .filter(({ relativePath }) => !isApprovedSecretFixture(relativePath))
    .filter(({ file }) => readFileSync(file, "utf8").includes(sentinel))
    .map(({ relativePath }) => relativePath);

  push(
    checks,
    "repo.no-unapproved-raw-fake-secret",
    offenders.length === 0,
    "raw fake secret sentinel appears only in approved fixtures and tests",
    `raw fake secret sentinel appears outside approved fixtures: ${offenders.join(", ")}`
  );
}



function runDoctor(rootDir: string): DoctorReport {
  const checks: DoctorCheck[] = [];
  checkEnvironment(rootDir, checks);
  checkBuildAvailability(rootDir, checks);
  checkRequiredFiles(rootDir, checks);
  checkGeneratedSmokeFiles(rootDir, checks);
  checkSecretSentinel(rootDir, checks);

  const sortedChecks = checks.sort((left, right) => left.id.localeCompare(right.id));
  return { ok: sortedChecks.every((check) => check.status === "pass"), checks: sortedChecks };
}

function parseFormat(args: string[]): "text" | "json" {
  const formatIndex = args.indexOf("--format");
  if (formatIndex === -1) return "text";

  const value = args[formatIndex + 1];
  if (value !== "json") throw new Error("doctor --format must be json");
  return value;
}

function formatText(report: DoctorReport): string {
  const failed = report.checks.filter((check) => check.status === "fail");
  const summary = `AgentShield doctor: ${report.ok ? "PASS" : "FAIL"} (${report.checks.length - failed.length}/${report.checks.length} checks passing)`;
  if (failed.length === 0) return summary;
  return [summary, "", ...failed.map((check) => `- ${check.id}: ${check.message}`)].join("\n");
}

export function runDoctorCommand(args: string[], cwd = process.cwd()): CliResult {
  const format = parseFormat(args);
  const report = runDoctor(cwd);

  return {
    exitCode: report.ok ? 0 : 1,
    stdout: format === "json" ? JSON.stringify(report, null, 2) : formatText(report),
    stderr: ""
  };
}
