import { describe, expect, it } from "vitest";
import { genericToolCallSchema, openaiToolCallSchema, anthropicToolCallSchema, geminiToolCallSchema } from "./providerToolCallSchema.js";

describe("providerToolCallSchema", () => {
  it("OpenAI-compatible tool call parses", () => {
    expect(openaiToolCallSchema.safeParse({
      id: "call_001",
      type: "function",
      function: { name: "fs.read", arguments: '{"path": "x"}' }
    }).success).toBe(true);
  });
  
  it("Anthropic-compatible tool call parses", () => {
    expect(anthropicToolCallSchema.safeParse({
      type: "tool_use",
      id: "toolu_001",
      name: "fs.read",
      input: { path: "x" }
    }).success).toBe(true);
  });
  
  it("Gemini-compatible tool call parses", () => {
    expect(geminiToolCallSchema.safeParse({
      functionCall: { name: "fs.read", args: { path: "x" } }
    }).success).toBe(true);
  });
  
  it("Generic tool call parses", () => {
    expect(genericToolCallSchema.safeParse({
      toolName: "fs.read", input: { path: "x" }
    }).success).toBe(true);
  });

  it("missing tool name fails closed", () => {
    expect(genericToolCallSchema.safeParse({}).success).toBe(false);
  });
});
