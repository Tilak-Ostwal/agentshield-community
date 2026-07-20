import { describe, expect, it } from "vitest";
import { collectAuditorEvidence } from "./auditorEvidenceCollector.js";

describe("auditorEvidenceCollector", () => {
  it("collector summarizes policy bundle verification", () => {
    const pack = collectAuditorEvidence({ policyBundleVerified: true });
    expect(pack.policy?.policyBundleVerified).toBe(true);
  });

  it("collector summarizes registry bundle verification", () => {
    const pack = collectAuditorEvidence({ registryBundleVerified: true });
    expect(pack.registry?.registryBundleVerified).toBe(true);
  });

  it("collector summarizes release-check", () => {
    const pack = collectAuditorEvidence({ releaseCheck: { passed: true, total: 10 } });
    expect(pack.checks.releaseCheck?.passed).toBe(true);
    expect(pack.checks.releaseCheck?.total).toBe(10);
  });

  it("collector summarizes benchmark status", () => {
    const pack = collectAuditorEvidence({ benchmark: { passed: false, failed: 2, totalScenarios: 10 } });
    expect(pack.checks.benchmark?.failed).toBe(2);
  });

  it("collector summarizes policy-audit status", () => {
    const pack = collectAuditorEvidence({ policyAudit: { passed: true, critical: 0, high: 0 } });
    expect(pack.checks.policyAudit?.passed).toBe(true);
  });

  it("collector summarizes policy-test status", () => {
    const pack = collectAuditorEvidence({ policyTest: { passed: true, failed: 0, total: 5 } });
    expect(pack.checks.policyTest?.total).toBe(5);
  });

  it("collector summarizes adapter-conformance status", () => {
    const pack = collectAuditorEvidence({ adapterConformance: { certification: "passed", failed: 0, total: 10 } });
    expect(pack.checks.adapterConformance?.certification).toBe("passed");
  });

  it("collector summarizes security-fuzz status if available", () => {
    const pack = collectAuditorEvidence({ securityFuzz: { certification: "passed", criticalFailed: 0 } });
    expect(pack.checks.securityFuzz?.certification).toBe("passed");
  });
});
