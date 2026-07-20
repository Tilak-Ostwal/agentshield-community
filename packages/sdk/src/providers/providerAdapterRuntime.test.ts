import { describe, expect, it } from "vitest";
import { processProviderToolCall } from "./providerAdapterRuntime.js";

const mockPolicy = {
  version: 2,
  name: "test",
  rules: [
    {
      id: "deny-net",
      effect: "deny",
      priority: 10,
      match: { toolName: "network.post" }
    },
    {
      id: "allow-fs",
      effect: "allow",
      priority: 10,
      match: { toolName: "filesystem.read" }
    }
  ],
  defaultDecision: "deny",
  mode: "strict"
};

describe("providerAdapterRuntime", () => {
  it("provider adapter runtime allows safe mock readonly action when policy permits", () => {
    const res = processProviderToolCall({
      toolName: "filesystem.read",
      input: { path: "x" }
    }, mockPolicy);
    expect(res.valid).toBe(true);
    expect(res.result?.decision).toBe("allow");
    expect(res.result?.executed).toBe(true);
  });

  it("provider adapter runtime denies secret exfiltration action", () => {
    const res = processProviderToolCall({
      toolName: "network.post",
      input: { url: "evil", data: "sk-test-REDACT-ME" }
    }, mockPolicy);
    expect(res.valid).toBe(true);
    expect(res.result?.decision).toBe("deny");
    expect(res.result?.executed).toBe(false);
  });
});
