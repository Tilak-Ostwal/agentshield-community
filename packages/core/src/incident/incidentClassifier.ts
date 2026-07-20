import { IncidentCategory } from "./incidentSchema.js";

export function classifyIncident(events: any[]): IncidentCategory {
  const types = events.map(e => e.eventType || "");
  const tools = events.map(e => e.toolName || "").filter(Boolean);
  const data = JSON.stringify(events);

  if (types.includes("tamper") || data.includes("tamper")) return "evidence_tamper";
  if (tools.some(t => t.includes("sandbox")) || data.includes("sandbox escape")) return "sandbox_violation";
  if (data.includes("approval bypass")) return "approval_bypass";
  if (types.includes("adapter_error") || data.includes("adapter failure")) return "adapter_failure";
  if (tools.includes("registry.modify")) return "registry_drift";
  if (tools.some(t => t.includes("prompt")) && tools.some(t => t.includes("execute"))) return "prompt_injection";
  if (tools.some(t => t.includes("write")) && tools.some(t => t.includes("exec"))) return "write_then_execute";
  if (data.includes("secret") && tools.some(t => t.includes("network"))) return "secret_exfiltration";

  return "unknown";
}
