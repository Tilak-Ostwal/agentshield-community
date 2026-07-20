import { describe, expect, it } from "vitest";
import { classifyMcpMethod } from "./mcpMethodPolicy.js";

describe("mcpMethodPolicy", () => {
  it("classifies requests and notifications", () => {
    expect(classifyMcpMethod("initialize", true)).toBe("request");
    expect(classifyMcpMethod("initialized", false)).toBe("notification");
    expect(classifyMcpMethod("unknown", true)).toBe("unsupported");
  });
});
