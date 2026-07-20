import { describe, expect, it } from "vitest";
import { LineJsonRpcReader } from "./lineJsonRpc.js";

describe("LineJsonRpcReader", () => {
  it("parses single message", () => {
    const reader = new LineJsonRpcReader({ maxMessageBytes: 1024 });
    expect(reader.push('{"jsonrpc":"2.0","id":1,"method":"tools/list"}\n')).toMatchObject({
      ok: true,
      messages: [{ jsonrpc: "2.0", id: 1, method: "tools/list" }]
    });
  });

  it("parses partial chunks", () => {
    const reader = new LineJsonRpcReader({ maxMessageBytes: 1024 });
    expect(reader.push('{"jsonrpc":"2.0",')).toMatchObject({ ok: true, messages: [] });
    expect(reader.push('"id":1,"method":"tools/list"}\n')).toMatchObject({
      ok: true,
      messages: [{ jsonrpc: "2.0", id: 1, method: "tools/list" }]
    });
  });

  it("parses multiple lines", () => {
    const reader = new LineJsonRpcReader({ maxMessageBytes: 1024 });
    expect(reader.push('{"a":1}\n{"b":2}\n')).toMatchObject({
      ok: true,
      messages: [{ a: 1 }, { b: 2 }]
    });
  });

  it("rejects invalid JSON", () => {
    const reader = new LineJsonRpcReader({ maxMessageBytes: 1024 });
    expect(reader.push("{bad}\n")).toMatchObject({ ok: false });
  });

  it("rejects oversized message", () => {
    const reader = new LineJsonRpcReader({ maxMessageBytes: 4 });
    expect(reader.push('{"a":1}\n')).toMatchObject({ ok: false });
  });
});
