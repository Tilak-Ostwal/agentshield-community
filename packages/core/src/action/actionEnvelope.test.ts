import { describe, expect, it } from "vitest";

import { actionEnvelopeSchema, parseActionEnvelope } from "./actionEnvelope.js";

describe("action envelope", () => {
  it("accepts a strict tool action envelope", () => {
    const action = parseActionEnvelope({
      actionId: "action_01",
      timestamp: "2026-06-25T00:00:00.000Z",
      actionType: "tool_call",
      toolName: "filesystem.read",
      input: { path: "README.md" }
    });

    expect(action.toolName).toBe("filesystem.read");
  });

  it("rejects unknown envelope fields", () => {
    expect(() =>
      actionEnvelopeSchema.parse({
        actionId: "action_01",
        timestamp: "2026-06-25T00:00:00.000Z",
        actionType: "tool_call",
        rawPrompt: "do not persist raw prompts"
      })
    ).toThrow();
  });
});
