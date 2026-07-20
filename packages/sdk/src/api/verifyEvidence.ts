import type { AgentShieldClient } from "../client/agentShieldClient.js";

export function verifyEvidence(client: AgentShieldClient, bundle: unknown): unknown {
  return client.verifyEvidence(bundle);
}
