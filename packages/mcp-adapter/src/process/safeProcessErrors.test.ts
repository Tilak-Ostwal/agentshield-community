import { describe, expect, it } from "vitest";

import { redactProcessText, safeProcessError } from "./safeProcessErrors.js";

describe("safe process errors", () => {
  it("redacts process text before returning it", () => {
    expect(redactProcessText("token sk-test-REDACT-ME", 100)).not.toContain("sk-test-REDACT-ME");
  });

  it("truncates oversized process text", () => {
    expect(redactProcessText("abcdef", 3)).toContain("[TRUNCATED]");
  });

  it("creates redacted safe errors", () => {
    expect(safeProcessError("process_launch_denied", "secret sk-test-REDACT-ME").message).not.toContain("sk-test-REDACT-ME");
  });
});
