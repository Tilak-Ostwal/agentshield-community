import { describe, expect, it } from "vitest";
import { McpLifecycle } from "./mcpLifecycle.js";

describe("McpLifecycle", () => {
  it("initialize returns safe initialized state", () => {
    const lifecycle = new McpLifecycle();
    expect(lifecycle.observe("initialize")).toMatchObject({ ok: true, state: "initialized" });
  });

  it("initialized notification does not produce unsafe execution", () => {
    const lifecycle = new McpLifecycle();
    lifecycle.observe("initialize");
    expect(lifecycle.observe("initialized")).toMatchObject({ ok: true, state: "initialized" });
  });

  it("invalid lifecycle order fails safely", () => {
    const lifecycle = new McpLifecycle();
    expect(lifecycle.observe("initialized")).toMatchObject({ ok: false });
  });
});
