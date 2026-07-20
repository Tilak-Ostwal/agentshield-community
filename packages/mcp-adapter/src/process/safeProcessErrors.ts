import { redactSecrets } from "@agentshield/core";

export type SafeProcessErrorCode =
  | "missing_process_policy"
  | "invalid_process_policy"
  | "process_launch_denied"
  | "process_timeout"
  | "process_output_rejected"
  | "process_launch_failed"
  | "process_invalid_response";

export interface SafeProcessError {
  code: SafeProcessErrorCode;
  message: string;
}

export function redactProcessText(text: string, maxBytes: number): string {
  const redacted = redactSecrets(text).value;
  const buffer = Buffer.from(redacted, "utf8");
  if (buffer.length <= maxBytes) return redacted;
  return `${buffer.subarray(0, maxBytes).toString("utf8")}[TRUNCATED]`;
}

export function safeProcessError(code: SafeProcessErrorCode, message: string): SafeProcessError {
  return { code, message: redactProcessText(message, 512) };
}
