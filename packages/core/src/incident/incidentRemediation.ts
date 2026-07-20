import { IncidentCategory } from "./incidentSchema.js";

export function generateIncidentRemediation(category: IncidentCategory) {
  if (category === "secret_exfiltration") {
    return [{
      priority: "high",
      title: "Keep secret-to-network deny rules enabled",
      details: "Maintain a deny rule for credential-like data flowing into external network tools."
    }];
  }
  return [{
    priority: "medium",
    title: "Review Agent Actions",
    details: "Check recent actions to ensure they conform to expected boundaries."
  }];
}
