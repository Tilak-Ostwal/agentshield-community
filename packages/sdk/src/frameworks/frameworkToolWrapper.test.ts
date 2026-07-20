import { describe, expect, it, vi } from "vitest";
import { executeFrameworkToolWrapper, redactFrameworkInput, buildFrameworkActionEnvelope } from "./frameworkToolWrapper.js";

const mockPolicy = {
  version: 2,
  name: "test",
  rules: [
    { id: "allow-fs", effect: "allow", priority: 10, match: { toolName: "filesystem.read" } },
    { id: "deny-net", effect: "deny", priority: 10, match: { toolName: "network.post" } },
    { id: "review-exec", effect: "require_human_review", priority: 10, match: { toolName: "system.exec" }, requireApproval: { reason: "test" } }
  ],
  defaultDecision: "deny",
  mode: "strict"
};

describe("frameworkToolWrapper", () => {
  it("tool wrapper creates deterministic ActionEnvelope", () => {
    const env = buildFrameworkActionEnvelope({
      version: 1,
      runnableId: "test-run",
      toolName: "filesystem.read",
      input: { path: "x" }
    });
    expect(env.actionType).toBe("tool_call");
    expect(env.toolName).toBe("filesystem.read");
    expect(env.input).toEqual({ path: "x" });
  });

  it("wrapper redacts sensitive input", () => {
    const pfx = "sk-test-";
    const sfx = "REDACT-ME";
    const redacted = redactFrameworkInput({ url: "x", auth: pfx + sfx });
    expect(JSON.stringify(redacted)).toContain("[REDACTED:unknown_secret_like]");
    expect(JSON.stringify(redacted)).not.toContain(pfx + sfx);
  });

  it("wrapper executes safe mock executor and returns output", () => {
    const fn = vi.fn(() => ({ data: "safe" }));
    const result = executeFrameworkToolWrapper(
      { version: 1, runnableId: "r1", toolName: "filesystem.read" },
      mockPolicy,
      {},
      fn
    );
    expect(result.executed).toBe(true);
    expect(result.decision).toBe("allow");
    expect(fn).toHaveBeenCalled();
    expect(result.safeOutput).toEqual({ data: "safe" });
  });

  it("denied step does not execute", () => {
    const fn = vi.fn(() => ({ data: "evil" }));
    const result = executeFrameworkToolWrapper(
      { version: 1, runnableId: "r2", toolName: "network.post" },
      mockPolicy,
      {},
      fn
    );
    expect(result.executed).toBe(false);
    expect(result.decision).toBe("deny");
    expect(fn).not.toHaveBeenCalled();
    expect(result.safeOutput).toBeNull();
  });

  it("review step does not execute", () => {
    const fn = vi.fn(() => ({ data: "exec" }));
    const result = executeFrameworkToolWrapper(
      { version: 1, runnableId: "r3", toolName: "system.exec" },
      mockPolicy,
      {},
      fn
    );
    expect(result.executed).toBe(false);
    expect(result.decision).toBe("review");
    expect(fn).not.toHaveBeenCalled();
  });
});
