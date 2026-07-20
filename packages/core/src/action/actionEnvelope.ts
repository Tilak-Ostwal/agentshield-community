import { z } from "zod";

export const actionEnvelopeSchema = z
  .object({
    actionId: z.string().min(1),
    sessionId: z.string().min(1).optional(),
    timestamp: z.string().datetime(),
    actionType: z.string().min(1),
    toolName: z.string().min(1).optional(),
    input: z.unknown().optional(),
    metadata: z.record(z.unknown()).optional(),
    llmAdvisory: z.record(z.unknown()).optional()
  })
  .strict();

export type ActionEnvelope = z.infer<typeof actionEnvelopeSchema>;

export function parseActionEnvelope(input: unknown): ActionEnvelope {
  return actionEnvelopeSchema.parse(input);
}
