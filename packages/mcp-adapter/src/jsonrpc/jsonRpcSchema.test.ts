import { describe, expect, it } from "vitest";

import { jsonRpcRequestSchema, jsonRpcResponseSchema } from "./jsonRpcSchema.js";

describe("jsonRpcSchema", () => {
  it("accepts supported MCP-like requests", () => {
    expect(
      jsonRpcRequestSchema.parse({
        jsonrpc: "2.0",
        id: "req_1",
        method: "tools/call",
        params: {
          name: "filesystem.read",
          arguments: {
            path: "/mock/project/readme.md"
          }
        }
      })
    ).toMatchObject({
      method: "tools/call"
    });
  });

  it("parses unsupported methods for policy-layer handling", () => {
    expect(
      jsonRpcRequestSchema.parse({
        jsonrpc: "2.0",
        id: "req_1",
        method: "resources/read"
      })
    ).toMatchObject({ method: "resources/read" });
  });

  it("requires response result or error but not both", () => {
    expect(
      jsonRpcResponseSchema.parse({
        jsonrpc: "2.0",
        id: "req_1",
        result: {
          ok: true
        }
      })
    ).toMatchObject({
      id: "req_1"
    });

    expect(() =>
      jsonRpcResponseSchema.parse({
        jsonrpc: "2.0",
        id: "req_1"
      })
    ).toThrow();
  });
});
