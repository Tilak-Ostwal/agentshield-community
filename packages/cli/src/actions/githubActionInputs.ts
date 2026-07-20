import { parseScoringProfile, type ScoringProfileName } from "@agentshield/bench";

export interface GithubActionInputs {
  profile: ScoringProfileName;
  policy?: string;
  registry?: string;
  sarif?: string;
  evidence?: string;
  markdown?: string;
  failOnCritical: boolean;
  minimumScore: number;
}

export type GithubActionRawInputs = Record<string, string | undefined>;

const fakeSecretSentinel = ["sk", "test", "REDACT", "ME"].join("-");
const productionSecretPattern = /\b(?:AKIA[0-9A-Z]{16}|ghp_[A-Za-z0-9]{36}|xox[baprs]-[A-Za-z0-9-]{20,}|Bearer\s+[A-Za-z0-9._-]+)\b/;

function rawValue(raw: GithubActionRawInputs, name: string): string | undefined {
  return raw[name] ?? raw[`INPUT_${name.toUpperCase().replaceAll("-", "_")}`];
}

function optionalString(raw: GithubActionRawInputs, name: string): string | undefined {
  const value = rawValue(raw, name)?.trim();
  if (value === undefined || value.length === 0) return undefined;
  if (value.includes(fakeSecretSentinel) || productionSecretPattern.test(value)) {
    throw new Error(`action input ${name} must not contain secrets`);
  }
  return value;
}

function parseBoolean(raw: GithubActionRawInputs, name: string, fallback: boolean): boolean {
  const value = rawValue(raw, name)?.trim().toLowerCase();
  if (value === undefined || value.length === 0) return fallback;
  if (value === "true") return true;
  if (value === "false") return false;
  throw new Error(`action input ${name} must be true or false`);
}

function parseMinimumScore(raw: GithubActionRawInputs): number {
  const value = rawValue(raw, "minimum-score")?.trim();
  if (value === undefined || value.length === 0) return 100;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 100) {
    throw new Error("action input minimum-score must be a number from 0 to 100");
  }
  return parsed;
}

function assertSafeRelativePath(name: string, value: string | undefined): void {
  if (value === undefined) return;
  const normalized = value.replaceAll("\\", "/");
  if (
    normalized.startsWith("/") ||
    /^[A-Za-z]:\//.test(normalized) ||
    normalized === "." ||
    normalized.includes("../") ||
    normalized.startsWith("../") ||
    normalized.endsWith("/..") ||
    normalized.includes("\0") ||
    normalized.startsWith("~")
  ) {
    throw new Error(`action input ${name} must be a safe relative path`);
  }
}

export function parseGithubActionInputs(raw: GithubActionRawInputs = process.env): GithubActionInputs {
  const profile = parseScoringProfile(optionalString(raw, "profile") ?? "strict");
  const policy = optionalString(raw, "policy");
  const registry = optionalString(raw, "registry");
  const sarif = optionalString(raw, "sarif");
  const evidence = optionalString(raw, "evidence");
  const markdown = optionalString(raw, "markdown");
  const inputs: GithubActionInputs = {
    profile,
    failOnCritical: parseBoolean(raw, "fail-on-critical", true),
    minimumScore: parseMinimumScore(raw),
    ...(policy === undefined ? {} : { policy }),
    ...(registry === undefined ? {} : { registry }),
    ...(sarif === undefined ? {} : { sarif }),
    ...(evidence === undefined ? {} : { evidence }),
    ...(markdown === undefined ? {} : { markdown })
  };

  assertSafeRelativePath("policy", inputs.policy);
  assertSafeRelativePath("registry", inputs.registry);
  assertSafeRelativePath("sarif", inputs.sarif);
  assertSafeRelativePath("evidence", inputs.evidence);
  assertSafeRelativePath("markdown", inputs.markdown);

  return inputs;
}
