import { describe, expect, it } from "vitest";

import {
  defaultAttackScenarios,
  readEnvThenNetworkScenario,
  secretExfiltrationScenario,
  unknownToolScenario,
  writeThenExecScenario
} from "../fixtures/index.js";
import { defineScenario } from "../scenario/attackScenario.js";
import { runBenchmarkScenario } from "./benchmarkRunner.js";

describe("benchmark runner", () => {
  it("passes a valid blocked attack", () => {
    const result = runBenchmarkScenario(unknownToolScenario);

    expect(result.passed).toBe(true);
    expect(result.finalDecision).toBe("deny");
  });

  it("fails when expected decision is wrong", () => {
    const scenario = defineScenario({
      ...unknownToolScenario,
      expected: {
        finalDecision: "allow"
      }
    });
    const result = runBenchmarkScenario(scenario);

    expect(result.passed).toBe(false);
    expect(result.failures[0]).toContain("expected final decision");
  });

  it("detects raw secret leakage in traces", () => {
    const scenario = defineScenario({
      ...secretExfiltrationScenario,
      expected: {
        ...secretExfiltrationScenario.expected,
        forbiddenRawSecrets: ["network.post"]
      }
    });
    const result = runBenchmarkScenario(scenario);

    expect(result.passed).toBe(false);
    expect(result.failures).toContain("trace contains forbidden raw secret network.post");
  });

  it("checks required risk markers", () => {
    const result = runBenchmarkScenario(writeThenExecScenario);

    expect(result.passed).toBe(true);
    expect(result.finalDecision).not.toBe("allow");
  });

  it("includes graph attack fixtures in the default benchmark", () => {
    expect(defaultAttackScenarios.map((scenario) => scenario.id)).toEqual(
      expect.arrayContaining([
        "read-env-then-network",
        "secret-token-then-network",
        "repeated-denied-attempts",
        "fingerprint-change-then-shell",
        "llm-advisory-allow-conflict",
        "package-install-attempt",
        "git-push-side-effect",
        "browser-then-shell",
        "network-write-with-token",
        "filesystem-read-sensitive-path",
        "read-env-summarize-network",
        "browser-untrusted-then-shell",
        "generated-code-then-shell",
        "credential-token-then-git-push",
        "private-user-data-network",
        "cookie-authorization-network"
      ])
    );
    expect(runBenchmarkScenario(readEnvThenNetworkScenario)).toMatchObject({
      passed: true,
      finalDecision: "deny"
    });
  });
});
