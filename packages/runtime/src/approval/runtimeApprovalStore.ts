import type { ApprovalTicket } from "@agentshield/core";

export class RuntimeApprovalStore {
  private readonly tickets = new Map<string, ApprovalTicket>();

  public save(ticket: ApprovalTicket): ApprovalTicket {
    this.tickets.set(ticket.ticketId, structuredClone(ticket));
    return structuredClone(ticket);
  }

  public get(ticketId: string): ApprovalTicket | undefined {
    const ticket = this.tickets.get(ticketId);
    return ticket === undefined ? undefined : structuredClone(ticket);
  }
}
