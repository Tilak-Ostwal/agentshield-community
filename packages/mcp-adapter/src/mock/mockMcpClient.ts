import type { JsonRpcRequest, JsonRpcResponse } from "../jsonrpc/jsonRpcSchema.js";
import type { McpAdapter } from "../adapter/mcpAdapter.js";

export class MockMcpClient {
  public constructor(private readonly adapter: McpAdapter) {}

  public send(request: JsonRpcRequest | unknown): JsonRpcResponse {
    return this.adapter.handle(request);
  }
}
