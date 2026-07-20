import { redactSecrets } from "@agentshield/core";

export interface LineJsonRpcOptions {
  maxMessageBytes: number;
}

export type LineJsonRpcReadResult =
  | { ok: true; messages: unknown[] }
  | { ok: false; error: string; messages: unknown[] };

export class LineJsonRpcReader {
  private buffer = "";

  public constructor(private readonly options: LineJsonRpcOptions) {}

  public push(chunk: string | Buffer): LineJsonRpcReadResult {
    const text = Buffer.isBuffer(chunk) ? chunk.toString("utf8") : chunk;
    this.buffer += text;

    if (Buffer.byteLength(this.buffer, "utf8") > this.options.maxMessageBytes) {
      this.buffer = "";
      return { ok: false, error: "JSON-RPC message exceeds maximum size", messages: [] };
    }

    const messages: unknown[] = [];
    const lines = this.buffer.split(/\r?\n/);
    this.buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (line.trim().length === 0) {
        continue;
      }

      try {
        const parsed = JSON.parse(line) as unknown;

        if (Array.isArray(parsed)) {
          return { ok: false, error: "JSON-RPC batch messages are not supported", messages };
        }

        messages.push(parsed);
      } catch {
        return { ok: false, error: "invalid line-delimited JSON", messages };
      }
    }

    return { ok: true, messages };
  }
}

export function encodeLineJsonRpc(message: unknown): string {
  return `${JSON.stringify(redactSecrets(message).value)}\n`;
}
