import { describe, expect, it } from "vitest";
import { errorCodeName, MCP_ERROR_CODES } from "./mcpErrorCodes.js";

describe("mcpErrorCodes", () => {
  it("error codes are stable", () => {
    expect(MCP_ERROR_CODES).toMatchObject({
      parseError: -32700,
      invalidRequest: -32600,
      methodNotFound: -32601,
      invalidParams: -32602,
      policyDenied: -32001,
      humanReviewRequired: -32002
    });
    expect(errorCodeName(-32601)).toBe("methodNotFound");
  });
});
