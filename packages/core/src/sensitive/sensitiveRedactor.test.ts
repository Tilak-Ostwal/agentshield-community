import { describe, expect, it } from "vitest";
import { redactSensitive } from "./sensitiveRedactor.js";

describe("sensitiveRedactor", () => {
  it("redactor preserves object shape", () => {
    const input = {
      id: 1,
      api_key: "my-secret",
      nested: {
        email: "test@example.com"
      }
    };
    const redacted = redactSensitive(input);
    expect(redacted).toEqual({
      id: 1,
      api_key: "[REDACTED:api_key]",
      nested: {
        email: "[REDACTED:email_address]"
      }
    });
  });

  it("redactor is deterministic", () => {
    const input = { token: "abc" };
    expect(redactSensitive(input)).toEqual(redactSensitive(input));
  });

  it("fake secret sentinel is redacted", () => {
    expect(redactSensitive("This is a sk-test-REDACT-ME key")).toBe("This is a [REDACTED:unknown_secret_like] key");
  });
});
