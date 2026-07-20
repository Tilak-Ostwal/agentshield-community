import { describe, it, expect } from "vitest";
import { parseAuditFinding } from "./auditFindingSchema.js";

describe("auditFindingSchema", () => {
  it("parses valid finding", () => {
    const valid = {
      id: "vuln-1",
      severity: "high",
      description: "Path traversal",
      reproduction: "Pass ../",
      remediation: "Sanitize path",
    };
    expect(() => parseAuditFinding(valid)).not.toThrow();
  });
});
