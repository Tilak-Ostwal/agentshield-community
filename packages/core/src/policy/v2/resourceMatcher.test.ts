import { describe, expect, it } from "vitest";
import { inferObservedResources, matchResourceScope } from "./resourceMatcher.js";

const action = {
  actionId: "a",
  timestamp: "2026-06-26T00:00:00.000Z",
  actionType: "tool_call",
  toolName: "filesystem.read",
  input: { path: "/mock/project/README.md" }
};

describe("resourceMatcher", () => {
  it("infers filesystem resources from actions", () => {
    expect(inferObservedResources(action)).toEqual([{ type: "filesystem", value: "/mock/project/README.md" }]);
  });

  it("resource deny overrides allow", () => {
    expect(matchResourceScope({
      type: "filesystem",
      allow: ["/mock/project/**"],
      deny: ["/mock/project/README.md"]
    }, inferObservedResources(action)).decision).toBe("no_match");
  });
});
