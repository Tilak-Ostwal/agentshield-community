import { describe, expect, it } from "vitest";
import { wrapToolResult } from "./providerToolResult.js";

describe("providerToolResult", () => {
  it("tool result wrapper redacts sensitive output", () => {
    const res = wrapToolResult("1", "t", "allow", true, "ok", { out: "sk-test-REDACT-ME" });
    expect(res.redactions.length).toBeGreaterThan(0);
    expect(JSON.stringify(res.safeOutput)).not.toContain("sk-test-REDACT-ME");
    expect(JSON.stringify(res.safeOutput)).toContain("[REDACTED:unknown_secret_like]");
  });

  it("denied action is not executed", () => {
    const res = wrapToolResult("1", "t", "deny", false, "blocked", null);
    expect(res.executed).toBe(false);
    expect(res.blocked).toBe(true);
  });
});
