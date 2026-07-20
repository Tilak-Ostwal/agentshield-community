import { describe, expect, it } from "vitest";
import { parseFrameworkToolRegistry } from "./frameworkToolSchema.js";

describe("frameworkToolSchema", () => {
  it("framework tool schema parses valid tool", () => {
    const valid = [
      {
        version: 1,
        toolId: "filesystem.read",
        name: "filesystem.read",
        description: "Read a mock project file.",
        capabilities: ["filesystem.read"],
        sideEffects: ["read"],
        inputSchema: { type: "object" },
        metadata: { framework: "generic", source: "local-fixture" }
      }
    ];
    const parsed = parseFrameworkToolRegistry(valid);
    expect(parsed.length).toBe(1);
    expect(parsed[0]?.toolId).toBe("filesystem.read");
  });

  it("invalid framework tool is rejected", () => {
    expect(() => parseFrameworkToolRegistry([{ version: 1 }])).toThrow();
    expect(() => parseFrameworkToolRegistry([{ version: 2, toolId: "x", name: "x", description: "x" }])).toThrow();
  });
});
