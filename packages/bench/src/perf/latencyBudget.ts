export type LatencyBudgetProfile = "strict" | "balanced" | "dev";

export interface LatencyBudget {
  profile: LatencyBudgetProfile;
  caseBudgetsMs: Record<string, number>;
}

const strictBudgets: Record<string, number> = {
  "policy.v1.evaluate": 5,
  "policy.v2.evaluate": 8,
  "runtime.processAction.safeRead": 20,
  "runtime.processAction.deniedNetworkToken": 25,
  "runtime.processAction.writeThenExecChain": 35,
  "evidence.bundleGeneration": 20,
  "bench.defaultCorpus": 150,
  "mcp.proxyMockToolCall": 25,
  "sdk.checkAction": 25
};

function scaleBudgets(scale: number): Record<string, number> {
  return Object.fromEntries(Object.entries(strictBudgets).map(([id, budget]) => [id, budget * scale]));
}

export const latencyBudgets: Record<LatencyBudgetProfile, LatencyBudget> = {
  strict: { profile: "strict", caseBudgetsMs: strictBudgets },
  balanced: { profile: "balanced", caseBudgetsMs: scaleBudgets(2) },
  dev: { profile: "dev", caseBudgetsMs: scaleBudgets(5) }
};

export function parseLatencyBudgetProfile(value: string | undefined): LatencyBudgetProfile {
  if (value === undefined || value.length === 0) return "balanced";
  if (value === "strict" || value === "balanced" || value === "dev") return value;
  throw new Error("perf --budget must be strict, balanced, or dev");
}

export function getLatencyBudget(profile: LatencyBudgetProfile = "balanced"): LatencyBudget {
  return latencyBudgets[profile];
}
