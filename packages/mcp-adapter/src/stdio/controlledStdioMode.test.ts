import { describe, expect, it } from "vitest";

import { runControlledStdioRequest } from "./controlledStdioMode.js";

const initializeScript = `
let input = "";
process.stdin.on("data", (chunk) => { input += chunk; });
process.stdin.on("end", () => {
  const request = JSON.parse(input.trim());
  process.stdout.write(JSON.stringify({
    jsonrpc: "2.0",
    id: request.id,
    result: { protocolVersion: "2024-11-05", serverInfo: { name: "test", version: "0" }, capabilities: { tools: {} } }
  }) + "\\n");
});
`;

function policy() {
  return {
    version: 1,
    mode: "controlled_stdio",
    allowlistedCommands: [
      {
        id: "mock",
        command: process.execPath,
        args: ["-e", initializeScript],
        envAllowlist: [],
        maxRuntimeMs: 5000,
        maxMessageBytes: 2048,
        maxStderrBytes: 128,
        reason: "test controlled stdio"
      }
    ],
    defaultTimeoutMs: 5000,
    denyShell: true,
    denyNetworkByDefault: true
  };
}

describe("controlled stdio mode", () => {
  it("initializes an allowlisted mock server", () => {
    const result = runControlledStdioRequest({
      processPolicy: policy(),
      commandId: "mock",
      request: { jsonrpc: "2.0", id: "init", method: "initialize" }
    });

    expect(result.ok).toBe(true);
    expect(result.ok ? result.response : undefined).toMatchObject({
      id: "init",
      result: { protocolVersion: "2024-11-05" }
    });
  });

  it("fails closed without a process policy", () => {
    const result = runControlledStdioRequest({
      processPolicy: undefined,
      commandId: "mock",
      request: { jsonrpc: "2.0", id: "init", method: "initialize" }
    });

    expect(result.ok).toBe(false);
    expect(result.ok === false ? result.error.code : "").toBe("invalid_process_policy");
  });
});
