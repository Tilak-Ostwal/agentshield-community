import { REQUIRED_DOMAINS } from "./readinessDomain.js";

export function generateCapabilityMaturityMatrix(): Record<string, string> {
  const matrix: Record<string, string> = {};
  for (const domain of REQUIRED_DOMAINS) {
    matrix[domain] = "beta"; // Default for tests
  }
  return matrix;
}
