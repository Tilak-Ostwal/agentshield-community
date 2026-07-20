import { defaultAttackScenarios } from "../fixtures/index.js";
import type { AttackScenario } from "../scenario/attackScenario.js";
import { benchmarkCorpusMetadata } from "./corpusMetadata.js";
import { validateAttackCorpus } from "./corpusValidator.js";

export function withCorpusMetadata(scenario: AttackScenario): AttackScenario {
  return {
    stability: "stable",
    addedInPhase: "pre-14",
    tags: scenario.tags ?? [scenario.category, scenario.severity],
    expectedControl:
      scenario.expected.finalDecision === "require_human_review" ? "human_review" :
      scenario.expected.finalDecision === "redact" ? "redact" :
      scenario.expected.finalDecision === "deny" ? "deny" :
      "trace_only",
    ...scenario
  };
}

export function loadPublicAttackCorpus() {
  const scenarios = defaultAttackScenarios.map(withCorpusMetadata);

  return {
    metadata: {
      ...benchmarkCorpusMetadata,
      scenarioCount: scenarios.length
    },
    scenarios
  };
}

export function validatePublicAttackCorpus() {
  return validateAttackCorpus(loadPublicAttackCorpus().scenarios);
}
