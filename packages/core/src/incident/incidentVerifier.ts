import { createHash } from "node:crypto";
import { RuntimeIncident, runtimeIncidentSchema } from "./incidentSchema.js";

export function computeIncidentHash(incident: Omit<RuntimeIncident, "incidentHash">): string {
  const clone = JSON.parse(JSON.stringify(incident));
  const data = JSON.stringify(clone);
  return createHash("sha256").update(data).digest("hex");
}

export function verifyIncident(incident: RuntimeIncident): { valid: boolean; failures: string[] } {
  const failures: string[] = [];
  
  const parsed = runtimeIncidentSchema.safeParse(incident);
  if (!parsed.success) {
    failures.push("Incident format is invalid: " + parsed.error.message);
    return { valid: false, failures };
  }

  const { incidentHash, ...rest } = incident;
  const expectedHash = computeIncidentHash(rest);

  if (incidentHash !== expectedHash) {
    failures.push("Incident hash mismatch.");
  }

  return { valid: failures.length === 0, failures };
}
