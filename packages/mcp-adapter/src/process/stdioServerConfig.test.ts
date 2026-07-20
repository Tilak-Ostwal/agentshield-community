import { describe, expect, it } from "vitest";

import { parseStdioServerConfig, stdioServerConfigSchema } from "./stdioServerConfig.js";

describe("stdio server config", () => {
  it("parses a config that references a command id and policy", () => {
    expect(parseStdioServerConfig({ commandId: "mock", processPolicy: { version: 1 } }).commandId).toBe("mock");
  });

  it("fails closed when command id is missing", () => {
    expect(stdioServerConfigSchema.safeParse({ processPolicy: {} }).success).toBe(false);
  });
});
