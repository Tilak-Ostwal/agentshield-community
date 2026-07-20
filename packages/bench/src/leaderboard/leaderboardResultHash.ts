import { createHash } from "crypto";
import { LeaderboardResult } from "./leaderboardResultSchema.js";
import { canonicalJson } from "@agentshield/core";

export function computeLeaderboardResultHash(result: Omit<LeaderboardResult, "resultHash">): string {
  const canonical = {
    version: result.version,
    resultId: result.resultId,
    createdAt: result.createdAt,
    project: result.project,
    corpus: result.corpus,
    run: result.run,
    checks: result.checks,
    limitations: [...result.limitations].sort()
  };
  return createHash("sha256").update(canonicalJson(canonical)).digest("hex");
}
