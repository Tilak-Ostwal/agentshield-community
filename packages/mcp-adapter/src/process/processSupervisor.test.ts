import { describe, expect, it } from "vitest";

import { ProcessSupervisor } from "./processSupervisor.js";

const responseScript = `
let input = "";
process.stdin.on("data", (chunk) => { input += chunk; });
process.stdin.on("end", () => {
  const request = JSON.parse(input.trim());
  process.stdout.write(JSON.stringify({ jsonrpc: "2.0", id: request.id, result: { ok: true, method: request.method } }) + "\\n");
});
`;

function policy(args: string[], overrides: Record<string, unknown> = {}) {
  return {
    version: 1,
    mode: "controlled_stdio",
    allowlistedCommands: [
      {
        id: "mock",
        command: process.execPath,
        args,
        envAllowlist: ["AGENTSHIELD_ALLOWED"],
        maxRuntimeMs: 5000,
        maxMessageBytes: 2048,
        maxStderrBytes: 128,
        reason: "test controlled mock",
        ...overrides
      }
    ],
    defaultTimeoutMs: 5000,
    denyShell: true,
    denyNetworkByDefault: true
  };
}

describe("process supervisor", () => {
  it("runs an allowlisted controlled stdio process", () => {
    const result = new ProcessSupervisor().runJsonRpc({
      policy: policy(["-e", responseScript]),
      commandId: "mock",
      request: { jsonrpc: "2.0", id: "1", method: "initialize" }
    });

    expect(result.ok).toBe(true);
    expect(result.lifecycle.map((event) => event.type)).toContain("process_started");
    expect(result.lifecycle.map((event) => event.type)).toContain("process_stopped");
  });

  it("rejects missing allowlist entries", () => {
    const result = new ProcessSupervisor().runJsonRpc({
      policy: policy(["-e", responseScript]),
      commandId: "other",
      request: { jsonrpc: "2.0", id: "1", method: "initialize" }
    });

    expect(result.ok).toBe(false);
    expect(result.ok === false ? result.error.code : "").toBe("process_launch_denied");
  });

  it("passes only explicitly allowlisted env keys", () => {
    const envScript = `
process.stdout.write(JSON.stringify({
  jsonrpc: "2.0",
  id: "env",
  result: {
    allowed: process.env.AGENTSHIELD_ALLOWED,
    denied: process.env.AGENTSHIELD_DENIED
  }
}) + "\\n");
`;
    const result = new ProcessSupervisor().runJsonRpc({
      policy: policy(["-e", envScript]),
      commandId: "mock",
      request: { jsonrpc: "2.0", id: "env", method: "env" },
      env: { AGENTSHIELD_ALLOWED: "yes", AGENTSHIELD_DENIED: "no" }
    });

    expect(result.ok).toBe(true);
    expect(result.ok ? result.response : undefined).toMatchObject({
      result: { allowed: "yes" }
    });
    expect(JSON.stringify(result.ok ? result.response : {})).not.toContain("AGENTSHIELD_DENIED");
  });

  it("terminates timed out processes safely", () => {
    const result = new ProcessSupervisor().runJsonRpc({
      policy: policy(["-e", "setTimeout(() => {}, 1000);"], { maxRuntimeMs: 10 }),
      commandId: "mock",
      request: { jsonrpc: "2.0", id: "timeout", method: "timeout" }
    });

    expect(result.ok).toBe(false);
    expect(result.ok === false ? result.error.code : "").toBe("process_timeout");
    expect(result.lifecycle.map((event) => event.type)).toContain("process_timeout");
  });

  it("fails closed on oversized stdout", () => {
    const result = new ProcessSupervisor().runJsonRpc({
      policy: policy(["-e", "process.stdout.write('x'.repeat(128));"], { maxMessageBytes: 16 }),
      commandId: "mock",
      request: { jsonrpc: "2.0", id: "large", method: "large" }
    });

    expect(result.ok).toBe(false);
    expect(result.ok === false ? result.error.code : "").toBe("process_output_rejected");
  });

  it("redacts oversized stderr safely", () => {
    const stderrScript = `
process.stderr.write("sk-test-REDACT-ME".repeat(4));
process.stdout.write(JSON.stringify({ jsonrpc: "2.0", id: "stderr", result: { ok: true } }) + "\\n");
`;
    const result = new ProcessSupervisor().runJsonRpc({
      policy: policy(["-e", stderrScript], { maxStderrBytes: 8 }),
      commandId: "mock",
      request: { jsonrpc: "2.0", id: "stderr", method: "stderr" }
    });

    expect(result.ok).toBe(false);
    expect(result.stderr).not.toContain("sk-test-REDACT-ME");
  });
});
