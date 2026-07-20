import { IncidentCategory } from "./incidentSchema.js";

export function determineIncidentSeverity(category: IncidentCategory): "critical" | "high" | "medium" | "low" | "info" {
  switch (category) {
    case "secret_exfiltration":
    case "sandbox_violation":
    case "evidence_tamper":
    case "write_then_execute":
      return "critical";
    case "pii_export":
    case "prompt_injection":
    case "policy_bypass":
    case "registry_drift":
    case "approval_bypass":
    case "adapter_failure":
    case "sensitive_data_leak":
      return "high";
    case "tool_abuse":
    case "repeated_denied_probe":
    case "runtime_fail_closed":
      return "medium";
    case "blocked_tool":
      return "low";
    case "unknown":
    default:
      return "info";
  }
}
