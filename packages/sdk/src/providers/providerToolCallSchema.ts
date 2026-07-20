import { z } from "zod";

export const providerToolCallShapeSchema = z.enum([
  "openai-compatible",
  "anthropic-compatible",
  "gemini-compatible",
  "generic"
]);

export const genericToolCallSchema = z.object({
  toolName: z.string().min(1),
  input: z.record(z.unknown()).optional(),
  id: z.string().optional()
});

export const openaiToolCallSchema = z.object({
  id: z.string().min(1),
  type: z.literal("function"),
  function: z.object({
    name: z.string().min(1),
    arguments: z.string() // stringified JSON
  })
});

export const anthropicToolCallSchema = z.object({
  type: z.literal("tool_use"),
  id: z.string().min(1),
  name: z.string().min(1),
  input: z.record(z.unknown())
});

export const geminiToolCallSchema = z.object({
  functionCall: z.object({
    name: z.string().min(1),
    args: z.record(z.unknown())
  })
});

export const normalizedToolCallSchema = z.object({
  version: z.literal(1),
  provider: providerToolCallShapeSchema,
  conversationId: z.string(),
  messageId: z.string(),
  toolCallId: z.string(),
  toolName: z.string(),
  arguments: z.record(z.unknown()),
  metadata: z.record(z.unknown()).optional()
}).strict();

export type NormalizedToolCall = z.infer<typeof normalizedToolCallSchema>;
