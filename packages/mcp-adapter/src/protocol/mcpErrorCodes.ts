export const MCP_ERROR_CODES = {
  parseError: -32700,
  invalidRequest: -32600,
  methodNotFound: -32601,
  invalidParams: -32602,
  internalFailClosed: -32603,
  policyDenied: -32001,
  humanReviewRequired: -32002,
  messageTooLarge: -32010,
  batchUnsupported: -32011
} as const;

export type McpErrorCodeName = keyof typeof MCP_ERROR_CODES;

export function errorCodeName(code: number): McpErrorCodeName | "unknown" {
  for (const [name, value] of Object.entries(MCP_ERROR_CODES)) {
    if (value === code) {
      return name as McpErrorCodeName;
    }
  }

  return "unknown";
}
