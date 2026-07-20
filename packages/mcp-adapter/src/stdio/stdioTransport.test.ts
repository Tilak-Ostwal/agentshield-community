import { Writable } from "node:stream";
import { describe, expect, it } from "vitest";
import { StdioJsonRpcTransport } from "./stdioTransport.js";

class CaptureWritable extends Writable {
  public chunks: string[] = [];
  public override _write(chunk: Buffer, _encoding: BufferEncoding, callback: (error?: Error | null) => void): void {
    this.chunks.push(chunk.toString("utf8"));
    callback();
  }
}

describe("StdioJsonRpcTransport", () => {
  it("emits parsed messages and writes line JSON", () => {
    const output = new CaptureWritable();
    const transport = new StdioJsonRpcTransport({ maxMessageBytes: 1024, output });
    const messages: unknown[] = [];
    transport.on("message", (message) => messages.push(message));

    transport.receive('{"jsonrpc":"2.0","id":"a","method":"tools/list"}\n');
    transport.send({ jsonrpc: "2.0", id: "a", result: { ok: true } });

    expect(messages).toEqual([{ jsonrpc: "2.0", id: "a", method: "tools/list" }]);
    expect(output.chunks.join("")).toBe('{"jsonrpc":"2.0","id":"a","result":{"ok":true}}\n');
  });
});
