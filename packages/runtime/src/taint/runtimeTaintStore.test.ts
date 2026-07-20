import { describe, expect, it } from "vitest";

import { RuntimeTaintStore } from "./runtimeTaintStore.js";

const base = {
  timestamp: "2026-06-26T00:00:00.000Z",
  actionType: "tool_call"
};

describe("RuntimeTaintStore", () => {
  it("propagates taint by same resource", () => {
    const store = new RuntimeTaintStore();

    store.observeAction({ ...base, actionId: "read_env", toolName: "filesystem.read", input: { path: "/mock/project/.env" } }, ["filesystem.read", "env.read"]);
    const result = store.observeAction({ ...base, actionId: "write_env", toolName: "filesystem.write", input: { path: "/mock/project/.env" } }, ["filesystem.write"]);

    expect(result.labels).toEqual(expect.arrayContaining(["env_secret", "secret"]));
    expect(result.propagations[0]?.reason).toBe("same resource");
  });

  it("propagates taint by previous action reference", () => {
    const store = new RuntimeTaintStore();

    store.observeAction({ ...base, actionId: "read_secret", toolName: "filesystem.read", input: { path: "/mock/secret.txt" } }, ["filesystem.read"]);
    const result = store.observeAction(
      { ...base, actionId: "post_secret", toolName: "network.post", input: { previousActionId: "read_secret", url: "https://example.invalid" } },
      ["network.write"]
    );

    expect(result.labels).toContain("secret");
    expect(result.sink.severity).toBe("critical");
  });
});
