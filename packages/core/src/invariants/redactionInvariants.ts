import { invariantFail, invariantPass, summarizeInvariants, type InvariantResult } from "./invariantResult.js";

export function checkNoRawSecrets(value: unknown, rawSecrets: string[], id = "no-raw-secrets"): InvariantResult {
  const serialized = JSON.stringify(value);
  const leakedSecrets = rawSecrets.filter((secret) => secret.length > 0 && serialized.includes(secret));

  if (leakedSecrets.length > 0) {
    return summarizeInvariants([
      invariantFail(id, `raw secret leaked: ${leakedSecrets.map((secret) => `"${secret}"`).join(", ")}`)
    ]);
  }

  return summarizeInvariants([invariantPass(id, "no raw secrets found")]);
}
