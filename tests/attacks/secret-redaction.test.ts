import { describe, expect, it } from "vitest";

import { REDACTED_VALUE, redactSecrets } from "../../packages/core/src/redaction/redactor.js";

describe("attack fixture: secret redaction", () => {
  it("redacts secrets before trace persistence", () => {
    const traceData = {
      headers: {
        authorization: "Bearer live_secret_token_1234567890"
      },
      body: "api_key=abc123456789012345678901234"
    };

    const result = redactSecrets(traceData);

    expect(result.value).toEqual({
      headers: {
        authorization: REDACTED_VALUE
      },
      body: REDACTED_VALUE
    });
    expect(JSON.stringify(result.value)).not.toContain("live_secret_token");
    expect(JSON.stringify(result.value)).not.toContain("abc123");
  });
});
