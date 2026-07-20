import type { AgentShieldClient, AgentShieldResult } from "../client/agentShieldClient.js";

export function checkAction(client: AgentShieldClient, action: unknown): AgentShieldResult {
  return client.checkAction(action);
}
