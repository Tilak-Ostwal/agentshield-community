import { ProcessSupervisor, type ProcessRunResult } from "../process/processSupervisor.js";

export interface ControlledStdioRequestInput {
  processPolicy: unknown;
  commandId: string;
  request: unknown;
  supervisor?: ProcessSupervisor;
}

export function runControlledStdioRequest(input: ControlledStdioRequestInput): ProcessRunResult {
  return (input.supervisor ?? new ProcessSupervisor()).runJsonRpc({
    policy: input.processPolicy,
    commandId: input.commandId,
    request: input.request
  });
}
