import type { ActionEnvelope } from "../action/actionEnvelope.js";
import { actionEnvelopeSchema } from "../action/actionEnvelope.js";

export interface HighRiskMarker {
  type: "write_then_exec_same_path";
  path: string;
  writeActionId: string;
  execActionId: string;
}

export interface SessionStateSnapshot {
  sessionId: string;
  actions: ActionEnvelope[];
  highRiskMarkers: HighRiskMarker[];
}

function getPathFromAction(action: ActionEnvelope): string | undefined {
  if (typeof action.input !== "object" || action.input === null) {
    return undefined;
  }

  const input = action.input as Record<string, unknown>;
  return typeof input.path === "string" && input.path.length > 0 ? input.path : undefined;
}

export class SessionState {
  public readonly sessionId: string;
  public readonly actions: ActionEnvelope[] = [];
  public readonly highRiskMarkers: HighRiskMarker[] = [];

  public constructor(sessionId: string) {
    if (sessionId.length === 0) {
      throw new Error("sessionId is required");
    }

    this.sessionId = sessionId;
  }

  public addAction(actionInput: unknown): void {
    const action = actionEnvelopeSchema.parse(actionInput);
    const path = getPathFromAction(action);

    if (action.toolName === "shell.exec" && path !== undefined) {
      const priorWrite = [...this.actions]
        .reverse()
        .find((priorAction) => priorAction.toolName === "filesystem.write" && getPathFromAction(priorAction) === path);

      if (priorWrite !== undefined) {
        this.highRiskMarkers.push({
          type: "write_then_exec_same_path",
          path,
          writeActionId: priorWrite.actionId,
          execActionId: action.actionId
        });
      }
    }

    this.actions.push(action);
  }

  public getRecentActions(limit = 10): ActionEnvelope[] {
    if (limit <= 0) {
      return [];
    }

    return this.actions.slice(-limit);
  }

  public snapshot(): SessionStateSnapshot {
    return {
      sessionId: this.sessionId,
      actions: [...this.actions],
      highRiskMarkers: [...this.highRiskMarkers]
    };
  }
}
