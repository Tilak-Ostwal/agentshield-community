import { spawnSync } from "node:child_process";

import { encodeLineJsonRpc, LineJsonRpcReader } from "../stdio/lineJsonRpc.js";
import { findAllowlistedCommand, processLaunchPolicySchema, type ProcessLaunchPolicy } from "./processLaunchPolicy.js";
import { redactProcessText, safeProcessError, type SafeProcessError } from "./safeProcessErrors.js";

export interface ProcessRunInput {
  policy: unknown;
  commandId: string;
  request: unknown;
  env?: Record<string, string | undefined>;
}

export type ProcessLifecycleEvent = {
  type:
    | "process_launch_denied"
    | "process_started"
    | "process_timeout"
    | "process_stopped"
    | "process_output_rejected";
  data: Record<string, unknown>;
};

export interface ProcessRunSuccess {
  ok: true;
  response: unknown;
  stdout: string;
  stderr: string;
  lifecycle: ProcessLifecycleEvent[];
}

export interface ProcessRunFailure {
  ok: false;
  error: SafeProcessError;
  stdout: string;
  stderr: string;
  lifecycle: ProcessLifecycleEvent[];
}

export type ProcessRunResult = ProcessRunSuccess | ProcessRunFailure;

function allowedEnv(keys: string[] | undefined, input: Record<string, string | undefined> | undefined): Record<string, string> {
  const output: Record<string, string> = {};
  for (const key of keys ?? []) {
    const value = input?.[key] ?? process.env[key];
    if (value !== undefined) output[key] = value;
  }
  return output;
}

export class ProcessSupervisor {
  public runJsonRpc(input: ProcessRunInput): ProcessRunResult {
    const parsed = processLaunchPolicySchema.safeParse(input.policy);
    if (!parsed.success) {
      return {
        ok: false,
        error: safeProcessError("invalid_process_policy", "invalid or missing process launch policy"),
        stdout: "",
        stderr: "",
        lifecycle: [{ type: "process_launch_denied", data: { reason: "invalid_process_policy", commandId: input.commandId } }]
      };
    }
    const policy: ProcessLaunchPolicy = parsed.data;
    if (policy.mode !== "controlled_stdio" || policy.denyShell !== true) {
      return {
        ok: false,
        error: safeProcessError("process_launch_denied", "controlled stdio requires denyShell policy"),
        stdout: "",
        stderr: "",
        lifecycle: [{ type: "process_launch_denied", data: { reason: "shell_denied", commandId: input.commandId } }]
      };
    }
    const command = findAllowlistedCommand(policy, input.commandId);
    if (command === undefined) {
      return {
        ok: false,
        error: safeProcessError("process_launch_denied", "command id is not allowlisted"),
        stdout: "",
        stderr: "",
        lifecycle: [{ type: "process_launch_denied", data: { reason: "command_not_allowlisted", commandId: input.commandId } }]
      };
    }

    const lifecycle: ProcessLifecycleEvent[] = [{ type: "process_started", data: { commandId: command.id, reason: command.reason } }];
    const child = spawnSync(command.command, command.args ?? [], {
      cwd: command.cwd,
      input: encodeLineJsonRpc(input.request),
      encoding: "utf8",
      timeout: Math.min(command.maxRuntimeMs, policy.defaultTimeoutMs),
      shell: false,
      env: allowedEnv(command.envAllowlist, input.env),
      maxBuffer: command.maxMessageBytes + command.maxStderrBytes + 1024,
      windowsHide: true
    });
    const stdout = redactProcessText(child.stdout ?? "", command.maxMessageBytes);
    const stderr = redactProcessText(child.stderr ?? "", command.maxStderrBytes);

    if (child.error !== undefined && (child.error as NodeJS.ErrnoException).code === "ETIMEDOUT") {
      lifecycle.push({ type: "process_timeout", data: { commandId: command.id, timeoutMs: Math.min(command.maxRuntimeMs, policy.defaultTimeoutMs) } });
      lifecycle.push({ type: "process_stopped", data: { commandId: command.id, timedOut: true } });
      return { ok: false, error: safeProcessError("process_timeout", "controlled stdio process timed out"), stdout, stderr, lifecycle };
    }

    if (child.error !== undefined) {
      lifecycle.push({ type: "process_stopped", data: { commandId: command.id, failed: true } });
      return { ok: false, error: safeProcessError("process_launch_failed", child.error.message), stdout, stderr, lifecycle };
    }

    if (Buffer.byteLength(child.stdout ?? "", "utf8") > command.maxMessageBytes || Buffer.byteLength(child.stderr ?? "", "utf8") > command.maxStderrBytes) {
      lifecycle.push({ type: "process_output_rejected", data: { commandId: command.id } });
      lifecycle.push({ type: "process_stopped", data: { commandId: command.id, outputRejected: true } });
      return { ok: false, error: safeProcessError("process_output_rejected", "controlled stdio output exceeded configured limit"), stdout, stderr, lifecycle };
    }

    const reader = new LineJsonRpcReader({ maxMessageBytes: command.maxMessageBytes });
    const read = reader.push(child.stdout ?? "");
    if (!read.ok || read.messages.length !== 1) {
      lifecycle.push({ type: "process_output_rejected", data: { commandId: command.id, reason: read.ok ? "missing_response" : read.error } });
      lifecycle.push({ type: "process_stopped", data: { commandId: command.id, invalidResponse: true } });
      return { ok: false, error: safeProcessError("process_invalid_response", read.ok ? "controlled stdio response missing" : read.error), stdout, stderr, lifecycle };
    }

    lifecycle.push({ type: "process_stopped", data: { commandId: command.id, exitCode: child.status ?? 0 } });
    return { ok: true, response: read.messages[0], stdout, stderr, lifecycle };
  }
}
