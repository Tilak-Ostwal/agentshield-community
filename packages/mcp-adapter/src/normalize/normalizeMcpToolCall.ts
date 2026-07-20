import { actionEnvelopeSchema, type ActionEnvelope } from "@agentshield/core";

import { mcpToolCallParamsSchema, type JsonRpcRequest } from "../jsonrpc/jsonRpcSchema.js";

export interface NormalizeMcpToolCallOptions {
  now?: () => Date;
  sessionId?: string;
}

function actionIdFromRequestId(id: JsonRpcRequest["id"]): string {
  if (typeof id === "string" && id.length > 0) {
    return id;
  }

  if (typeof id === "number") {
    return `req_${id}`;
  }

  return "req_null";
}

export function normalizeMcpToolCall(
  request: JsonRpcRequest,
  options: NormalizeMcpToolCallOptions = {}
): ActionEnvelope {
  if (request.method !== "tools/call") {
    throw new Error("only tools/call requests can be normalized");
  }

  const params = mcpToolCallParamsSchema.parse(request.params);
  const input = params.arguments ?? {};
  const candidate = {
    actionId: actionIdFromRequestId(request.id),
    ...(options.sessionId === undefined ? {} : { sessionId: options.sessionId }),
    timestamp: (options.now ?? (() => new Date()))().toISOString(),
    actionType: "tool_call",
    toolName: params.name,
    input,
    metadata: {
      protocol: "mcp-like-json-rpc",
      method: request.method
    }
  };

  return actionEnvelopeSchema.parse(candidate);
}
