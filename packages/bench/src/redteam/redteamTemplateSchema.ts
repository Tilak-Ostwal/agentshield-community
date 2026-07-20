import { z } from "zod";

import { attackScenarioCategorySchema, attackScenarioSeveritySchema } from "../scenario/attackScenario.js";

const templateStepSchema = z
  .object({
    toolName: z.string().min(1),
    input: z.record(z.unknown())
  })
  .strict();

export const redteamTemplateSchema = z
  .object({
    version: z.literal(1),
    templateId: z.string().min(1),
    name: z.string().min(1),
    category: attackScenarioCategorySchema,
    severity: attackScenarioSeveritySchema,
    description: z.string().min(1),
    variables: z.record(z.array(z.string().min(1)).min(1)),
    steps: z.array(templateStepSchema).min(1),
    expectedFinalDecisions: z.array(z.enum(["allow", "deny", "redact", "require_human_review"])).min(1),
    expectedRiskMarkersAny: z.array(z.string().min(1)).min(1)
  })
  .strict();

export type RedteamTemplate = z.infer<typeof redteamTemplateSchema>;

export interface RedteamTemplateParseResult {
  ok: boolean;
  template?: RedteamTemplate;
  error?: string;
}

export function parseRedteamTemplate(input: unknown): RedteamTemplateParseResult {
  const result = redteamTemplateSchema.safeParse(input);
  if (!result.success) return { ok: false, error: result.error.message };
  return { ok: true, template: result.data };
}
