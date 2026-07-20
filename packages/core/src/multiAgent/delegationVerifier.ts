import { type AgentIdentity } from "./agentIdentity.js";

export interface ApprovalTokenBinding {
  originalAgentId: string;
  delegatedAgentId: string;
  actionHash: string;
  chainLength: number;
}

export function verifyDelegationChainBinding(
  chain: AgentIdentity[],
  actionHash: string,
  tokenBinding?: ApprovalTokenBinding
): boolean {
  if (!tokenBinding) return false;
  if (chain.length === 0) return false;
  
  const originalAgentId = chain[0]?.agentId;
  const delegatedAgentId = chain[chain.length - 1]?.agentId;
  
  return (
    tokenBinding.originalAgentId === originalAgentId &&
    tokenBinding.delegatedAgentId === delegatedAgentId &&
    tokenBinding.actionHash === actionHash &&
    tokenBinding.chainLength === chain.length
  );
}
