import { validateAdapter, type AgentShieldAdapter } from "./adapterContract.js";

export class AdapterRegistry {
  private readonly adapters = new Map<string, AgentShieldAdapter>();

  public register(adapter: AgentShieldAdapter): void {
    const valid = validateAdapter(adapter);
    if (this.adapters.has(valid.adapterId)) {
      throw new Error(`duplicate adapterId: ${valid.adapterId}`);
    }
    this.adapters.set(valid.adapterId, valid);
  }

  public get(adapterId: string): AgentShieldAdapter {
    const adapter = this.adapters.get(adapterId);
    if (adapter === undefined) throw new Error(`unknown adapterId: ${adapterId}`);
    return adapter;
  }

  public list(): AgentShieldAdapter[] {
    return [...this.adapters.values()].sort((left, right) => left.adapterId.localeCompare(right.adapterId));
  }
}
