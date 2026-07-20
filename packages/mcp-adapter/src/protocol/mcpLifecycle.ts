export type McpLifecycleState = "created" | "initialized";

export interface McpLifecycleResult {
  ok: boolean;
  state: McpLifecycleState;
  error?: string;
}

export class McpLifecycle {
  private state: McpLifecycleState = "created";

  public current(): McpLifecycleState {
    return this.state;
  }

  public observe(method: string): McpLifecycleResult {
    if (method === "initialize") {
      this.state = "initialized";
      return { ok: true, state: this.state };
    }

    if (method === "initialized") {
      if (this.state !== "initialized") {
        return { ok: false, state: this.state, error: "initialized notification received before initialize" };
      }

      return { ok: true, state: this.state };
    }

    if (this.state === "created" && (method === "tools/list" || method === "tools/call")) {
      return { ok: false, state: this.state, error: "tool methods require initialize first" };
    }

    return { ok: true, state: this.state };
  }
}
