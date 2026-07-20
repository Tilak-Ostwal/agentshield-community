import { redactSecrets } from "@agentshield/core";

import { AdapterRegistry } from "../adapterRegistry.js";
import { validateAdapter, type AdapterProcessResult, type AgentShieldAdapter } from "../adapterContract.js";
import { createAgentShield } from "../../client/agentShieldClient.js";
import { loadPolicy } from "../../loaders/loadPolicy.js";
import {
  parseAdapterConformanceSuite,
  type AdapterCertificationCaseResult,
  type AdapterCertificationResult,
  type AdapterConformanceSuite,
  type CertificationStatus,
  type RegistrationCase,
  type ToolCallCase
} from "./conformanceSchema.js";

const FAKE_SECRET = ["sk", "test", "REDACT", "ME"].join("-");

export interface RunAdapterConformanceOptions {
  /** Override the policy used for conformance runs. Defaults to deny-by-default. */
  policy?: unknown;
  /** Working directory for resolving policyPath from the suite. */
  cwd?: string;
}

// ── Registration case handlers ───────────────────────────────────────────────

function runDuplicateRegistrationCase(
  adapter: AgentShieldAdapter,
  caseItem: RegistrationCase
): AdapterCertificationCaseResult {
  const failures: string[] = [];
  let registrationFailed = false;

  try {
    const registry = new AdapterRegistry();
    registry.register(adapter);
    registry.register(adapter);
  } catch {
    registrationFailed = true;
  }

  if (!registrationFailed) {
    failures.push("duplicate adapter registration did not throw");
  }

  return {
    id: caseItem.id,
    name: caseItem.name,
    caseType: "duplicate_registration",
    passed: failures.length === 0,
    failures,
    warnings: []
  };
}

function runInvalidMetadataCase(caseItem: RegistrationCase): AdapterCertificationCaseResult {
  const failures: string[] = [];
  let registrationFailed = false;

  try {
    validateAdapter({} as AgentShieldAdapter);
  } catch {
    registrationFailed = true;
  }

  if (!registrationFailed) {
    failures.push("invalid adapter metadata did not throw on validation");
  }

  return {
    id: caseItem.id,
    name: caseItem.name,
    caseType: "invalid_metadata",
    passed: failures.length === 0,
    failures,
    warnings: []
  };
}

// ── Tool-call case handler ───────────────────────────────────────────────────

async function runToolCallCase(
  adapter: AgentShieldAdapter,
  caseItem: ToolCallCase,
  options: RunAdapterConformanceOptions,
  effectivePolicy: unknown
): Promise<AdapterCertificationCaseResult> {
  const shield = createAgentShield({
    policy: effectivePolicy,
    ...(options.cwd !== undefined ? { cwd: options.cwd } : {})
  });
  shield.registerAdapter(adapter);

  const failures: string[] = [];

  let result: AdapterProcessResult;
  try {
    result = await shield.processAdapterToolCall(adapter.adapterId, caseItem.toolCall);
  } catch (error) {
    const message = error instanceof Error ? error.message : "unexpected conformance error";
    return {
      id: caseItem.id,
      name: caseItem.name,
      caseType: "tool_call",
      passed: false,
      failures: [`conformance runner threw unexpectedly: ${message}`],
      warnings: []
    };
  }

  const { expected } = caseItem;

  if (result.decision !== expected.decision) {
    failures.push(`expected decision "${expected.decision}" but got "${result.decision}"`);
  }

  if (result.forwarded !== expected.forwarded) {
    failures.push(`expected forwarded=${String(expected.forwarded)} but got forwarded=${String(result.forwarded)}`);
  }

  if (result.executionStatus !== expected.executionStatus) {
    failures.push(`expected executionStatus "${expected.executionStatus}" but got "${result.executionStatus}"`);
  }

  if ((result.decision === "deny" || result.decision === "require_human_review") && result.forwarded) {
    failures.push(`certification failure: "${result.decision}" decision was forwarded`);
  }

  if (expected.mustNotForward === true && result.forwarded) {
    failures.push("certification failure: action was forwarded but mustNotForward is true");
  }

  if (expected.executionStatus === "error" && result.executionStatus === "executed") {
    failures.push("certification failure: execution error did not fail closed");
  }

  const serialized = JSON.stringify(redactSecrets(result).value);
  if (serialized.includes(FAKE_SECRET)) {
    failures.push(`certification failure: fake secret sentinel appears in case output`);
  }

  return {
    id: caseItem.id,
    name: caseItem.name,
    caseType: "tool_call",
    passed: failures.length === 0,
    decision: result.decision,
    forwarded: result.forwarded,
    executionStatus: result.executionStatus,
    failures,
    warnings: []
  };
}

// ── Certification status resolver ────────────────────────────────────────────

function resolveCertificationStatus(
  caseResults: AdapterCertificationCaseResult[],
  certificationFailures: string[]
): CertificationStatus {
  if (certificationFailures.length > 0 || caseResults.some((c) => !c.passed && c.warnings.length === 0)) {
    return "fail";
  }
  if (caseResults.some((c) => c.warnings.length > 0)) {
    return "passed_with_warnings";
  }
  return "pass";
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Run the adapter conformance harness against a custom adapter.
 *
 * @param adapter - The adapter under test.
 * @param suite - Parsed or raw conformance suite. Raw objects are validated with the suite schema.
 * @param options - Optional runner options (policy override, cwd).
 * @returns A deterministic certification result. Does not throw on case failures; returns fail status.
 */
export async function runAdapterConformance(
  adapter: AgentShieldAdapter,
  suite: AdapterConformanceSuite | unknown,
  options: RunAdapterConformanceOptions = {}
): Promise<AdapterCertificationResult> {
  const parsedSuite = parseAdapterConformanceSuite(suite);
  const caseResults: AdapterCertificationCaseResult[] = [];
  const certificationFailures: string[] = [];

  let effectivePolicy: unknown = options.policy;
  if (effectivePolicy === undefined && parsedSuite.policyPath !== undefined) {
    const loaded = loadPolicy(parsedSuite.policyPath, options.cwd ?? process.cwd());
    if (loaded.ok) {
      effectivePolicy = loaded.policy;
    }
  }

  for (const caseItem of parsedSuite.cases) {
    let caseResult: AdapterCertificationCaseResult;

    if (caseItem.type === "tool_call") {
      caseResult = await runToolCallCase(adapter, caseItem, options, effectivePolicy);
    } else if (caseItem.type === "duplicate_registration") {
      caseResult = runDuplicateRegistrationCase(adapter, caseItem);
    } else {
      caseResult = runInvalidMetadataCase(caseItem);
    }

    caseResults.push(caseResult);
  }

  const anySecretLeak = caseResults.some((c) =>
    c.failures.some((f) => f.includes("fake secret sentinel"))
  );
  if (anySecretLeak) {
    certificationFailures.push("fake secret sentinel appeared in one or more case outputs");
  }

  const certificationStatus = resolveCertificationStatus(caseResults, certificationFailures);
  const passed = caseResults.filter((c) => c.passed).length;

  return {
    adapterId: adapter.adapterId,
    adapterName: adapter.adapterName,
    suiteName: parsedSuite.suiteName,
    certificationStatus,
    total: caseResults.length,
    passed,
    failed: caseResults.length - passed,
    warnings: caseResults.filter((c) => c.warnings.length > 0 && c.passed).length,
    cases: caseResults,
    certificationFailures
  };
}
