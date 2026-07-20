import { EventEmitter } from "node:events";
import type { Writable } from "node:stream";

import { encodeLineJsonRpc, LineJsonRpcReader } from "./lineJsonRpc.js";

export interface StdioTransportOptions {
  maxMessageBytes: number;
  output: Writable;
}

export class StdioJsonRpcTransport extends EventEmitter {
  private readonly reader: LineJsonRpcReader;

  public constructor(private readonly options: StdioTransportOptions) {
    super();
    this.reader = new LineJsonRpcReader({ maxMessageBytes: options.maxMessageBytes });
  }

  public receive(chunk: string | Buffer): void {
    const result = this.reader.push(chunk);

    for (const message of result.messages) {
      this.emit("message", message);
    }

    if (!result.ok) {
      this.emit("error", new Error(result.error));
    }
  }

  public send(message: unknown): void {
    this.options.output.write(encodeLineJsonRpc(message));
  }
}
