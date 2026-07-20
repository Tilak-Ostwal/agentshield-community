import type { AgentShieldClient, AgentShieldMcpResult, ProcessActionOptions } from "../client/agentShieldClient.js";

export function processMcpToolCall(client: AgentShieldClient, request: unknown, options?: ProcessActionOptions): AgentShieldMcpResult {
  return client.processMcpToolCall(request, options);
}
