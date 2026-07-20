import { describe, expect, it } from "vitest";

import { parsePolicyTestFile } from "./policyTestSchema.js";

const valid = {
  version: 1,
  name: "suite",
  policyPath: "policy.json",
  tests: [
    {
      id: "allow-read",
      name: "Allow read",
      action: {
        actionId: "read_1",
        timestamp: "2026-06-28T00:00:00.000Z",
        actionType: "tool_call",
        toolName: "filesystem.read",
        input: { path: "/mock/project/README.md" }
      },
      expected: { decision: "allow" }
    }
  ]
};

describe("policy test schema", () => {
  it("parses valid file", () => {
    expect(parsePolicyTestFile(valid)).toMatchObject({ name: "suite" });
  });

  it("rejects duplicate test IDs", () => {
    expect(() => parsePolicyTestFile({ ...valid, tests: [valid.tests[0], valid.tests[0]] })).toThrow("duplicate test id");
  });
});
