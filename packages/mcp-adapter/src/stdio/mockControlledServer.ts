import { redactSecrets } from "@agentshield/core";
import { LineJsonRpcReader, encodeLineJsonRpc } from "./lineJsonRpc.js";

const tools = [
  { name: "filesystem.read", description: "Controlled mock read.", inputSchema: { type: "object" }, capabilities: ["filesystem.read"] },
  { name: "filesystem.write", description: "Controlled mock write simulation.", inputSchema: { type: "object" }, capabilities: ["filesystem.write"] },
  { name: "network.post", description: "Controlled mock network simulation.", inputSchema: { type: "object" }, capabilities: ["network.write"] },
  { name: "shell.exec", description: "Controlled mock shell simulation.", inputSchema: { type: "object" }, capabilities: ["shell.exec", "code_execution"] }
];

function responseFor(message: unknown): unknown {
  if (typeof message !== "object" || message === null) return { jsonrpc: "2.0", id: null, error: { code: -32600, message: "invalid request" } };
  const request = message as { id?: unknown; method?: unknown; params?: unknown };
  const id = request.id ?? null;
  if (request.method === "initialize") {
    return { jsonrpc: "2.0", id, result: { protocolVersion: "2024-11-05", serverInfo: { name: "agentshield-controlled-mock", version: "0.0.0" }, capabilities: { tools: { listChanged: false } } } };
  }
  if (request.method === "tools/list") return { jsonrpc: "2.0", id, result: { tools } };
  if (request.method === "tools/call") {
    const params = typeof request.params === "object" && request.params !== null ? (request.params as Record<string, unknown>) : {};
    const toolName = typeof params.name === "string" ? params.name : "unknown.tool";
    return { jsonrpc: "2.0", id, result: redactSecrets({ content: [{ type: "text", text: `controlled mock result for ${toolName}` }], mockOnly: true }).value };
  }
  return { jsonrpc: "2.0", id, error: { code: -32601, message: "method not found" } };
}

const input = await new Promise<string>((resolve) => {
  let buffer = "";
  process.stdin.setEncoding("utf8");
  process.stdin.on("data", (chunk) => {
    buffer += chunk;
  });
  process.stdin.on("end", () => resolve(buffer));
});
const reader = new LineJsonRpcReader({ maxMessageBytes: 1024 * 1024 });
const read = reader.push(input);
const message = read.ok ? read.messages[0] : undefined;
process.stdout.write(encodeLineJsonRpc(responseFor(message)));
