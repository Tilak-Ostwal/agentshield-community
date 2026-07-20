import type { MarketplaceEntry } from "./marketplaceEntrySchema.js";

export interface SafetyScoreResult {
  score: number;
  valid: boolean;
  notes: string[];
}

function getRawPolicyRules(value: unknown): Array<{ effect?: unknown; action?: unknown; resource?: unknown }> {
  if (typeof value !== "object" || value === null || !("rules" in value)) {
    return [];
  }
  const rules = (value as { rules?: unknown }).rules;
  if (!Array.isArray(rules)) {
    return [];
  }
  return rules.filter((rule): rule is { effect?: unknown; action?: unknown; resource?: unknown } => typeof rule === "object" && rule !== null);
}

function getRawPolicyPack(value: unknown): { defaultEffect?: unknown; rules: Array<{ effect?: unknown; action?: unknown; resource?: unknown }> } | undefined {
  if (typeof value !== "object" || value === null) {
    return undefined;
  }
  return {
    defaultEffect: (value as { defaultEffect?: unknown }).defaultEffect,
    rules: getRawPolicyRules(value)
  };
}

export function calculateMarketplaceSafetyScore(
  entry: MarketplaceEntry,
  packContentRaw: string
): SafetyScoreResult {
  let score = 100;
  const notes: string[] = [];
  let valid = true;

  try {
    const rawPack = JSON.parse(packContentRaw) as unknown;
    const pack = getRawPolicyPack(rawPack);
    if (pack === undefined) {
      valid = false;
      score = 0;
      notes.push("FAIL: Policy pack JSON is invalid.");
      return { score, valid, notes };
    }

    if (pack.defaultEffect === "allow") {
      valid = false;
      score = 0;
      notes.push("FAIL: Pack weakens deny-by-default behavior.");
    }

    const hasWarnRules = pack.rules.some((rule) => rule.effect === "warn");
    if (hasWarnRules && entry.safetyLevel !== "dev") {
      valid = false;
      score = 0;
      notes.push("FAIL: Pack contains warn rules but claims non-dev safety level.");
    }

    const hasBroadAllow = pack.rules.some((rule) => {
      return rule.effect === "allow" && (rule.action === "*" || rule.resource === "*");
    });
    if (hasBroadAllow && entry.safetyLevel !== "dev") {
      valid = false;
      score = 0;
      notes.push("FAIL: Unsafe broad allow detected without dev-warning mode.");
    }

  } catch (e) {
    valid = false;
    score = 0;
    notes.push("FAIL: Policy pack JSON is invalid.");
  }

  // Fail if entry lacks limitations/non-certification disclaimer
  const hasDisclaimer = entry.limitations.some(l => l.includes("legal") || l.includes("compliance") || l.includes("certification"));
  if (!hasDisclaimer) {
    valid = false;
    score = 0;
    notes.push("FAIL: Entry lacks non-certification disclaimer in limitations.");
  }

  // Warn if no policy bundle/provenance is attached
  if (!entry.requiredChecks.bundleRecommended) {
    score = Math.max(0, score - 10);
    notes.push("WARN: No policy bundle/provenance attached.");
  }

  // Warn if publisher is unknown
  if (entry.publisher.type === "unknown") {
    score = Math.max(0, score - 20);
    notes.push("WARN: Unknown publisher.");
  }

  // Warn if compatible profiles are too broad
  if (entry.compatibleWorkspaceProfiles.includes("all") || entry.compatibleWorkspaceProfiles.length > 5) {
    score = Math.max(0, score - 10);
    notes.push("WARN: Compatible profiles are too broad.");
  }

  return { score, valid, notes };
}
