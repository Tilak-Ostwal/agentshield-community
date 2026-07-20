import { describe, expect, it } from "vitest";

import { REDACTED_VALUE, redactSecrets } from "./redactor.js";

describe("redactor", () => {
  it("redacts sensitive keys without mutating input", () => {
    const input = {
      user: "alice",
      password: "correct-horse",
      nested: {
        apiKey: "sk-1234567890abcdef1234567890abcdef"
      }
    };

    const result = redactSecrets(input);

    expect(result.value).toEqual({
      user: "alice",
      password: REDACTED_VALUE,
      nested: {
        apiKey: REDACTED_VALUE
      }
    });
    expect(input.password).toBe("correct-horse");
    expect(result.redactions.map((redaction) => redaction.field)).toEqual([
      "data.password",
      "data.nested.apiKey"
    ]);
  });

  it("redacts secret-looking string values", () => {
    const result = redactSecrets({
      message: "use token=abc123456789012345678901234"
    });

    expect(result.value).toEqual({
      message: `use ${REDACTED_VALUE}`
    });
    expect(result.redactions).toHaveLength(1);
  });
});
