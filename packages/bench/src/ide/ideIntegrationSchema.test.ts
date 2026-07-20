import { describe, it, expect } from "vitest";
import { ideIntegrationSchema } from "./ideIntegrationSchema.js";

describe("ideIntegrationSchema", () => {
  it("parses valid config", () => {
    const config = {
      version: 1,
      ide: "vscode",
      commands: { "test": "pnpm cli -- doctor" }
    };
    expect(ideIntegrationSchema.parse(config).version).toBe(1);
  });
  it("rejects invalid config", () => {
    expect(() => ideIntegrationSchema.parse({ version: 2 })).toThrow();
  });
});
