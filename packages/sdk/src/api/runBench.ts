import type { AgentShieldClient, RunBenchOptions } from "../client/agentShieldClient.js";

export function runBench(client: AgentShieldClient, options?: RunBenchOptions): unknown {
  return client.runBench(options);
}
