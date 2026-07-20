import { z } from "zod";

export const jsonRpcIdSchema = z.union([z.string(), z.number(), z.null()]);

export type JsonRpcId = z.infer<typeof jsonRpcIdSchema>;

export const jsonRpcRequestSchema = z
  .object({
    jsonrpc: z.literal("2.0"),
    id: jsonRpcIdSchema,
    method: z.string().min(1),
    params: z.unknown().optional()
  })
  .strict();

export const jsonRpcMessageSchema = z
  .object({
    jsonrpc: z.literal("2.0"),
    id: jsonRpcIdSchema.optional(),
    method: z.string().min(1),
    params: z.unknown().optional()
  })
  .strict();

export const mcpToolCallParamsSchema = z
  .object({
    name: z.string().min(1),
    arguments: z.record(z.unknown()).optional(),
    _meta: z.record(z.unknown()).optional()
  })
  .strict();

export const jsonRpcErrorSchema = z
  .object({
    code: z.number(),
    message: z.string(),
    data: z.unknown().optional()
  })
  .strict();

export const jsonRpcResponseSchema = z
  .object({
    jsonrpc: z.literal("2.0"),
    id: jsonRpcIdSchema,
    result: z.unknown().optional(),
    error: jsonRpcErrorSchema.optional()
  })
  .strict()
  .refine((response) => (response.result === undefined) !== (response.error === undefined), {
    message: "JSON-RPC response must include exactly one of result or error"
  });

export type JsonRpcRequest = z.infer<typeof jsonRpcRequestSchema>;
export type JsonRpcMessage = z.infer<typeof jsonRpcMessageSchema>;
export type McpToolCallParams = z.infer<typeof mcpToolCallParamsSchema>;
export type JsonRpcResponse = z.infer<typeof jsonRpcResponseSchema>;
