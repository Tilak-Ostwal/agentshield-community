import { LineJsonRpcReader } from "../stdio/lineJsonRpc.js";
import type { JsonRpcResponse } from "../jsonrpc/jsonRpcSchema.js";
import { errorCodeName, MCP_ERROR_CODES } from "../protocol/mcpErrorCodes.js";
import { defaultProxyDemoPolicy } from "../proxy/mcpProxy.js";
import { McpProxySession } from "../proxy/mcpProxySession.js";
import type { LocalToolRegistry } from "@agentshield/registry";
import type { ConformanceFixture } from "./conformanceFixture.js";
import { createCompatibilityReport, type CompatibilityFixtureResult, type CompatibilityReport } from "./compatibilityReport.js";
import { goldenConformanceFixtures } from "./goldenFixtures.js";

function decisionFromResponse(response: unknown): string | undefined {
  if (typeof response !== "object" || response === null) return undefined;
  const record = response as Record<string, unknown>;
  const payload = record.error instanceof Object ? (record.error as Record<string, unknown>).data : record.result;
  if (typeof payload !== "object" || payload === null) return undefined;
  const decision = (payload as Record<string, unknown>).decision;
  return typeof decision === "string" ? decision : undefined;
}

export function runConformanceFixture(fixture: ConformanceFixture, options: { policy?: unknown; toolRegistry?: LocalToolRegistry } = {}): CompatibilityFixtureResult {
  const session = new McpProxySession({
    config: { mode: "mock", maxMessageBytes: 1024 * 1024, allowMethods: ["initialize", "initialized", "ping", "tools/list", "tools/call"] },
    policy: options.policy ?? defaultProxyDemoPolicy(),
    ...(options.toolRegistry === undefined ? {} : { toolRegistry: options.toolRegistry }),
    sessionId: `conformance_${fixture.id}`
  });
  const responses: JsonRpcResponse[] = [];

  for (const message of fixture.inputMessages) {
    if (Array.isArray(message)) {
      responses.push({ jsonrpc: "2.0", id: null, error: { code: MCP_ERROR_CODES.batchUnsupported, message: "JSON-RPC batch messages are not supported" } });
      continue;
    }

    const response = session.handleMessage(message);
    if (response !== undefined) responses.push(response);
  }

  const logs = session.getDecisionLogs();
  const forwardedCalls = logs.filter((log) => log.forwarded);
  const decisions = responses.map(decisionFromResponse).filter((decision): decision is string => decision !== undefined);
  const failures: string[] = [];

  if (fixture.expected.responseCount !== undefined && responses.length !== fixture.expected.responseCount) {
    failures.push(`expected ${fixture.expected.responseCount} responses but got ${responses.length}`);
  }
  for (const method of fixture.expected.requiredMethodsSeen ?? []) {
    if (!logs.some((log) => log.method === method) && !fixture.inputMessages.some((message) => typeof message === "object" && message !== null && !Array.isArray(message) && (message as Record<string, unknown>).method === method)) {
      failures.push(`missing required method ${method}`);
    }
  }
  for (const method of fixture.expected.forbiddenForwardedMethods ?? []) {
    if (forwardedCalls.some((log) => log.method === method)) failures.push(`forbidden method forwarded ${method}`);
  }
  for (const toolName of fixture.expected.forbiddenForwardedToolNames ?? []) {
    if (forwardedCalls.some((log) => log.toolName === toolName)) failures.push(`forbidden tool forwarded ${toolName}`);
  }
  const errorNames = responses.flatMap((response) => response.error === undefined ? [] : [errorCodeName(response.error.code)]);
  for (const code of fixture.expected.requiredErrorCodes ?? []) {
    if (!errorNames.includes(code as never)) failures.push(`missing required error code ${code}`);
  }
  for (const decision of fixture.expected.requiredDecisions ?? []) {
    if (!decisions.includes(decision)) failures.push(`missing required decision ${decision}`);
  }
  const serialized = JSON.stringify({ responses, logs });
  for (const secret of fixture.expected.mustRedactSecrets ?? []) {
    if (serialized.includes(secret)) failures.push(`unredacted secret ${secret}`);
  }

  return {
    fixtureId: fixture.id,
    name: fixture.name,
    passed: failures.length === 0,
    failures,
    forwardedCalls,
    responses,
    decisions
  };
}

export function runConformanceFixtures(fixtures: ConformanceFixture[] = goldenConformanceFixtures, options: { policy?: unknown; toolRegistry?: LocalToolRegistry } = {}): CompatibilityReport {
  return createCompatibilityReport(fixtures.map((fixture) => runConformanceFixture(fixture, options)));
}

export function runOversizedLineFixture(): CompatibilityFixtureResult {
  const reader = new LineJsonRpcReader({ maxMessageBytes: 8 });
  const result = reader.push('{"jsonrpc":"2.0","id":"x","method":"tools/list"}\n');
  const response = result.ok ? [] : [{ jsonrpc: "2.0" as const, id: null, error: { code: MCP_ERROR_CODES.messageTooLarge, message: result.error } }];
  return {
    fixtureId: "oversized-message",
    name: "Oversized Message",
    passed: response.length === 1,
    failures: response.length === 1 ? [] : ["oversized message did not fail closed"],
    forwardedCalls: [],
    responses: response,
    decisions: []
  };
}
