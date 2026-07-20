import crypto from "crypto";
import { PerfBaseline, PerfCurrentRun } from "./perfBaselineSchema.js";

export function generateBaselineHash(baseline: PerfBaseline): string {
  const cpy = { ...baseline, baselineHash: undefined };
  return crypto.createHash("sha256").update(JSON.stringify(cpy)).digest("hex");
}

export function generateRunHash(run: PerfCurrentRun): string {
  const cpy = { ...run, runHash: undefined };
  return crypto.createHash("sha256").update(JSON.stringify(cpy)).digest("hex");
}
