import { z } from "zod";

import type { ActionEnvelope, PolicyDecision } from "@agentshield/core";
import type { RuntimeDecision } from "@agentshield/runtime";

export const adapterProtocolSchema = z.enum(["mcp", "custom", "openai-tools", "langchain-like", "local-agent"]);

export const adapterToolSchema = z
  .object({
    toolName: z.string().min(1),
    description: z.string().min(1).optional(),
    capabilities: z.array(z.string().min(1)).default([])
  })
  .strict();

export interface AdapterTool extends z.infer<typeof adapterToolSchema> {}

export interface AdapterExecutionResult {
  ok: boolean;
  status: "executed" | "blocked" | "error";
  output?: unknown;
  error?: string;
}

export interface AgentShieldAdapter {
  adapterId: string;
  adapterName: string;
  protocol: z.infer<typeof adapterProtocolSchema>;
  listTools(): Promise<AdapterTool[]>;
  normalizeToolCall(input: unknown): Promise<ActionEnvelope>;
  executeAllowedAction(action: ActionEnvelope, decision: RuntimeDecision): Promise<AdapterExecutionResult>;
}

export interface AdapterProcessResult {
  ok: boolean;
  adapterId: string;
  adapterName: string;
  protocol: z.infer<typeof adapterProtocolSchema>;
  decision: PolicyDecision | "invalid";
  forwarded: boolean;
  executionStatus: "executed" | "blocked" | "error";
  action?: ActionEnvelope;
  runtimeDecision?: RuntimeDecision;
  executionResult?: AdapterExecutionResult;
  error?: string;
}

export function validateAdapter(adapter: AgentShieldAdapter): AgentShieldAdapter {
  const metadata = z
    .object({
      adapterId: z.string().min(1),
      adapterName: z.string().min(1),
      protocol: adapterProtocolSchema,
      listTools: z.function(),
      normalizeToolCall: z.function(),
      executeAllowedAction: z.function()
    })
    .passthrough()
    .parse(adapter);
  return metadata as AgentShieldAdapter;
}

export function validateAdapterExecutionResult(result: unknown): AdapterExecutionResult {
  return z
    .object({
      ok: z.boolean(),
      status: z.enum(["executed", "blocked", "error"]),
      output: z.unknown().optional(),
      error: z.string().optional()
    })
    .strict()
    .parse(result) as AdapterExecutionResult;
}
