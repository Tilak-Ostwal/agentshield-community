import { z } from "zod";
import type { ProcessLaunchPolicy } from "./processLaunchPolicy.js";

export const stdioServerConfigSchema = z
  .object({
    commandId: z.string().min(1),
    processPolicy: z.any()
  })
  .strict();

export interface StdioServerConfig {
  commandId: string;
  processPolicy: ProcessLaunchPolicy;
}

export function parseStdioServerConfig(input: unknown): { commandId: string; processPolicy: unknown } {
  const parsed = stdioServerConfigSchema.parse(input);
  if (!Object.prototype.hasOwnProperty.call(parsed, "processPolicy")) {
    throw new Error("processPolicy is required");
  }
  return { commandId: parsed.commandId, processPolicy: parsed.processPolicy };
}
