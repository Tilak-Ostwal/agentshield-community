import { type AgentIdentity } from "./agentIdentity.js";

export interface SessionEdge {
  fromAgentId: string;
  toAgentId: string;
  timestamp: number;
}

export class MultiAgentSessionGraph {
  public agents: Map<string, AgentIdentity> = new Map();
  public edges: SessionEdge[] = [];

  public addAgent(agent: AgentIdentity): void {
    this.agents.set(agent.agentId, agent);
  }

  public recordDelegation(fromAgentId: string, toAgentId: string): void {
    this.edges.push({ fromAgentId, toAgentId, timestamp: Date.now() });
  }

  public getAgent(agentId: string): AgentIdentity | undefined {
    return this.agents.get(agentId);
  }

  public getDelegationChain(leafAgentId: string): AgentIdentity[] {
    const chain: AgentIdentity[] = [];
    let currentId: string | undefined = leafAgentId;
    
    while (currentId) {
      const agent = this.agents.get(currentId);
      if (agent) {
        chain.unshift(agent);
      }
      
      const edge = this.edges.slice().reverse().find(e => e.toAgentId === currentId);
      const nextId: string | undefined = edge ? edge.fromAgentId : undefined;
      
      if (nextId && chain.find(a => a.agentId === nextId)) {
        break;
      }
      currentId = nextId;
    }
    
    return chain;
  }
}
