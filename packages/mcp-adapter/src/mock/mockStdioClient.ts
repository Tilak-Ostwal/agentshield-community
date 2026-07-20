import { PassThrough } from "node:stream";

import { StdioJsonRpcTransport } from "../stdio/stdioTransport.js";

export class MockStdioClient {
  public readonly output = new PassThrough();
  public readonly transport: StdioJsonRpcTransport;

  public constructor(maxMessageBytes = 1024 * 1024) {
    this.transport = new StdioJsonRpcTransport({
      maxMessageBytes,
      output: this.output
    });
  }

  public sendRaw(raw: string): void {
    this.transport.receive(raw);
  }
}
