import { readFileSync } from "node:fs";
import { isAbsolute, resolve } from "node:path";

import { compilePolicyV2, parsePolicy, redactSecrets, type PolicyDecision } from "@agentshield/core";
import { MockMcpServer } from "@agentshield/mcp-adapter";
import { createLocalRegistry, parseRegistryFile, validateRegistryFile, type LocalToolRegistry } from "@agentshield/registry";
import { createRuntimeContext, processAction } from "@agentshield/runtime";

import { parsePolicyTestFile, type PolicyTestCase, type PolicyTestFile } from "./policyTestSchema.js";

export interface PolicyTestAssertion {
  field: string;
  expected: unknown;
  actual: unknown;
  passed: boolean;
}

export interface PolicyTestCaseResult {
  id: string;
  name: string;
  passed: boolean;
  decision: PolicyDecision;
  ruleId: string;
  capabilitiesObserved: string[];
  taintObserved: string[];
  riskMarkers: string[];
  forwarded: boolean;
  approvalTicket: boolean;
  executionPreflightStatus: string;
  sandboxDecision?: string;
  assertions: PolicyTestAssertion[];
}

export interface PolicyTestRunResult {
  version: 1;
  name: string;
  policyPath: string;
  registryPath?: string;
  total: number;
  passed: number;
  failed: number;
  results: PolicyTestCaseResult[];
}

function readJson(path: string): unknown {
  return JSON.parse(readFileSync(path, "utf8"));
}

function resolvePath(cwd: string, filePath: string): string {
  return isAbsolute(filePath) ? filePath : resolve(cwd, filePath);
}

function loadPolicy(policyPath: string, cwd: string): unknown {
  const policy = readJson(resolvePath(cwd, policyPath));
  if (typeof policy === "object" && policy !== null && (policy as { version?: unknown }).version === 2) {
    const compiled = compilePolicyV2(policy);
    if (!compiled.ok) throw new Error(`invalid policy: ${compiled.diagnostics.map((diagnostic) => diagnostic.message).join("; ")}`);
    return policy;
  }
  const parsed = parsePolicy(policy);
  if (!parsed.ok) throw new Error(`invalid policy: ${parsed.error ?? "unknown policy error"}`);
  return parsed.policy;
}

function loadRegistry(registryPath: string | undefined, cwd: string): LocalToolRegistry | undefined {
  if (registryPath === undefined) return undefined;
  const registryFile = parseRegistryFile(readJson(resolvePath(cwd, registryPath)));
  const validation = validateRegistryFile(registryFile);
  if (!validation.valid) {
    throw new Error(`invalid registry: ${validation.issues.map((issue) => `${issue.code}: ${issue.message}`).join("; ")}`);
  }
  return createLocalRegistry(registryFile);
}

function markerText(marker: unknown): string {
  return typeof marker === "string" ? marker : JSON.stringify(marker);
}

function assertion(field: string, expected: unknown, actual: unknown, passed: boolean): PolicyTestAssertion {
  return { field, expected, actual, passed };
}

function includesAny(actual: string[], expected: string[] | undefined): boolean {
  if (expected === undefined) return true;
  if (expected.length === 0) return actual.length === 0;
  return expected.some((item) => actual.includes(item));
}

function evaluateCase(test: PolicyTestCase, policy: unknown, registry: LocalToolRegistry | undefined): PolicyTestCaseResult {
  const mockServer = new MockMcpServer();
  const context = createRuntimeContext({
    policy,
    sessionId: `policy_test_${test.id}`,
    traceId: `trace_policy_test_${test.id}`,
    now: () => new Date("2026-06-28T00:00:00.000Z"),
    ...(registry === undefined ? {} : { toolRegistry: registry })
  });
  const toolMetadata = typeof test.action.toolName === "string" ? mockServer.getToolMetadata(test.action.toolName) : undefined;
  const decision = processAction(context, test.action, {
    ...(toolMetadata === undefined ? {} : { toolMetadata }),
    approval: { enabled: true },
    execution: { enabled: true, dryRun: true },
    sandbox: { enabled: true }
  });
  const riskMarkers = decision.riskMarkers.map(markerText);
  const sandboxProfile = decision.sandboxDecision?.profileId;
  const forwarded = decision.decision === "allow";
  const assertions = [
    assertion("decision", test.expected.decision, decision.decision, decision.decision === test.expected.decision),
    ...(test.expected.ruleId === undefined ? [] : [assertion("ruleId", test.expected.ruleId, decision.ruleId, decision.ruleId === test.expected.ruleId)]),
    assertion("capabilitiesAny", test.expected.capabilitiesAny, decision.capabilitiesObserved, includesAny(decision.capabilitiesObserved, test.expected.capabilitiesAny)),
    assertion("taintAny", test.expected.taintAny, decision.taintObserved, includesAny(decision.taintObserved, test.expected.taintAny)),
    assertion("riskMarkersAny", test.expected.riskMarkersAny, riskMarkers, includesAny(riskMarkers, test.expected.riskMarkersAny)),
    ...(test.expected.forwarded === undefined ? [] : [assertion("forwarded", test.expected.forwarded, forwarded, forwarded === test.expected.forwarded)]),
    ...(test.expected.approvalTicket === undefined ? [] : [assertion("approvalTicket", test.expected.approvalTicket, decision.approvalTicket !== undefined, (decision.approvalTicket !== undefined) === test.expected.approvalTicket)]),
    ...(test.expected.executionPreflightStatus === undefined ? [] : [assertion("executionPreflightStatus", test.expected.executionPreflightStatus, decision.executionPreflightStatus, decision.executionPreflightStatus === test.expected.executionPreflightStatus)]),
    ...(test.expected.sandboxDecision === undefined ? [] : [assertion("sandboxDecision", test.expected.sandboxDecision, sandboxProfile, sandboxProfile === test.expected.sandboxDecision)])
  ];

  return redactSecrets({
    id: test.id,
    name: test.name,
    passed: assertions.every((item) => item.passed),
    decision: decision.decision,
    ruleId: decision.ruleId,
    capabilitiesObserved: decision.capabilitiesObserved,
    taintObserved: decision.taintObserved,
    riskMarkers,
    forwarded,
    approvalTicket: decision.approvalTicket !== undefined,
    executionPreflightStatus: decision.executionPreflightStatus,
    ...(sandboxProfile === undefined ? {} : { sandboxDecision: sandboxProfile }),
    assertions
  }).value as PolicyTestCaseResult;
}

export function runPolicyTestFile(testFile: PolicyTestFile, cwd = process.cwd()): PolicyTestRunResult {
  const policy = loadPolicy(testFile.policyPath, cwd);
  const registry = loadRegistry(testFile.registryPath, cwd);
  const results = testFile.tests.map((test) => evaluateCase(test, policy, registry));
  const passed = results.filter((result) => result.passed).length;

  return redactSecrets({
    version: 1,
    name: testFile.name,
    policyPath: testFile.policyPath,
    ...(testFile.registryPath === undefined ? {} : { registryPath: testFile.registryPath }),
    total: results.length,
    passed,
    failed: results.length - passed,
    results
  }).value as PolicyTestRunResult;
}

export function runPolicyTestPath(path: string, cwd = process.cwd()): PolicyTestRunResult {
  return runPolicyTestFile(parsePolicyTestFile(readJson(resolvePath(cwd, path))), cwd);
}
