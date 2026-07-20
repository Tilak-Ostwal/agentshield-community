import { Writable } from "node:stream";
import { describe, expect, it } from "vitest";
import { McpProxy } from "./mcpProxy.js";
import { StdioJsonRpcTransport } from "../stdio/stdioTransport.js";

class CaptureWritable extends Writable {
  public chunks: string[] = [];
  public override _write(chunk: Buffer, _encoding: BufferEncoding, callback: (error?: Error | null) => void): void {
    this.chunks.push(chunk.toString("utf8"));
    callback();
  }
}

describe("McpProxy lifecycle", () => {
  it("handles request/response lifecycle through transport", () => {
    const output = new CaptureWritable();
    const transport = new StdioJsonRpcTransport({ maxMessageBytes: 1024 * 1024, output });
    const proxy = new McpProxy({ config: { mode: "mock", maxMessageBytes: 1024 * 1024, allowMethods: ["tools/list", "tools/call"] } });
    proxy.attach(transport);

    transport.receive('{"jsonrpc":"2.0","id":"list","method":"tools/list"}\n');

    expect(output.chunks.join("")).toContain('"tools"');
  });

  it("invalid JSON input fails closed through transport", () => {
    const output = new CaptureWritable();
    const transport = new StdioJsonRpcTransport({ maxMessageBytes: 1024, output });
    const proxy = new McpProxy({ config: { mode: "mock", maxMessageBytes: 1024, allowMethods: ["tools/list", "tools/call"] } });
    proxy.attach(transport);

    transport.receive("{bad}\n");

    expect(output.chunks.join("")).toContain("-32700");
    expect(proxy.session.forwardedCallCount).toBe(0);
  });
});
