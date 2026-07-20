import type { AttackScenario } from "../scenario/attackScenario.js";

export interface CorpusValidationIssue {
  severity: "error" | "warning";
  code: string;
  message: string;
  scenarioId?: string;
}

export interface CorpusValidationResult {
  valid: boolean;
  issues: CorpusValidationIssue[];
}

const realUrlPattern = /https?:\/\/(?!example\.invalid\b|attacker\.invalid\b|mock\b|mock\.invalid\b)[^\s"'<>]+/i;
const forbiddenPathPattern = /(?:^|["'\s])(?:\/etc\/|\/home\/|\/Users\/|C:\\Users\\|C:\\Windows\\)/i;
const destructiveCommandPattern = /\b(rm\s+-rf|del\s+\/[sfq]|format\s+[a-z]:|shutdown\b|curl\s+https?:\/\/|wget\s+https?:\/\/)\b/i;
const productionSecretPattern = /\b(?:AKIA[0-9A-Z]{16}|ghp_[A-Za-z0-9]{36}|xox[baprs]-[A-Za-z0-9-]{20,})\b/;
const fakeSecretSentinel = ["sk", "test", "REDACT", "ME"].join("-");

function textOf(value: unknown): string {
  return JSON.stringify(value);
}

export function validateAttackCorpus(scenarios: AttackScenario[]): CorpusValidationResult {
  const issues: CorpusValidationIssue[] = [];
  const ids = new Set<string>();

  for (const scenario of scenarios) {
    if (ids.has(scenario.id)) {
      issues.push({ severity: "error", code: "DUPLICATE_SCENARIO_ID", message: "scenario IDs must be unique", scenarioId: scenario.id });
    }
    ids.add(scenario.id);

    if (scenario.stability === "stable" && scenario.description.trim().length === 0) {
      issues.push({ severity: "error", code: "STABLE_DESCRIPTION_REQUIRED", message: "stable scenarios require a description", scenarioId: scenario.id });
    }
    if (scenario.severity === undefined) {
      issues.push({ severity: "error", code: "SEVERITY_REQUIRED", message: "scenario severity is required", scenarioId: scenario.id });
    }
    if (scenario.category === undefined) {
      issues.push({ severity: "error", code: "CATEGORY_REQUIRED", message: "scenario category is required", scenarioId: scenario.id });
    }
    if (scenario.expected === undefined) {
      issues.push({ severity: "error", code: "EXPECTED_REQUIRED", message: "expected result is required", scenarioId: scenario.id });
    }
    if ((scenario.tags ?? []).length === 0) {
      issues.push({ severity: "error", code: "TAGS_REQUIRED", message: "each scenario must have at least one tag", scenarioId: scenario.id });
    }
    const expectedDecisions = scenario.expected.acceptableFinalDecisions ?? [scenario.expected.finalDecision];
    if (scenario.severity === "critical" && !expectedDecisions.some((decision) => decision === "deny" || decision === "require_human_review")) {
      issues.push({ severity: "error", code: "CRITICAL_CONTROL_REQUIRED", message: "critical scenarios require deny or human review", scenarioId: scenario.id });
    }
    if (scenario.expected.forbiddenRawSecrets !== undefined && !scenario.expected.forbiddenRawSecrets.includes(fakeSecretSentinel)) {
      issues.push({ severity: "error", code: "FAKE_SECRET_CHECK_REQUIRED", message: "forbiddenRawSecrets scenarios must include the fake secret sentinel", scenarioId: scenario.id });
    }

    const serialized = textOf(scenario);
    if (productionSecretPattern.test(serialized)) {
      issues.push({ severity: "error", code: "PRODUCTION_SECRET_FORBIDDEN", message: "scenario contains a production-looking secret", scenarioId: scenario.id });
    }
    if (realUrlPattern.test(serialized)) {
      issues.push({ severity: "error", code: "REAL_URL_FORBIDDEN", message: "scenario contains a non-mock external URL", scenarioId: scenario.id });
    }
    if (forbiddenPathPattern.test(serialized)) {
      issues.push({ severity: "error", code: "REAL_PATH_FORBIDDEN", message: "scenario contains a real filesystem path outside mock/temp fixtures", scenarioId: scenario.id });
    }
    if (destructiveCommandPattern.test(serialized)) {
      issues.push({ severity: "error", code: "DESTRUCTIVE_COMMAND_FORBIDDEN", message: "scenario contains a destructive command string", scenarioId: scenario.id });
    }
  }

  return { valid: !issues.some((issue) => issue.severity === "error"), issues };
}
