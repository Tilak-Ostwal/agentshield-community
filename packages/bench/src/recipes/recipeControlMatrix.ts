import { RecipeControl } from "./recipeSchema.js";

export const CONTROL_MATRIX: Record<string, RecipeControl> = {
  "AS-CONTROL-001": {
    controlId: "AS-CONTROL-001",
    name: "Fail-Closed Runtime Decisions",
    coveredBy: ["security-fuzz", "runtime", "bench"],
    evidence: ["security-fuzz report", "benchmark report"],
    limitations: ["Local deterministic checks only; not a legal compliance certification."]
  },
  "AS-CONTROL-002": {
    controlId: "AS-CONTROL-002",
    name: "Secret and Sensitive Data Redaction",
    coveredBy: ["sensitive-scan", "auditor-export", "incident-report"],
    evidence: ["auditor-evidence.json", "incident-report.md"],
    limitations: ["Local deterministic checks only; not a legal compliance certification."]
  },
  "AS-CONTROL-003": {
    controlId: "AS-CONTROL-003",
    name: "Policy Review and Auditability",
    coveredBy: ["policy-audit", "policy-bundle"],
    evidence: ["policy-bundle.json"],
    limitations: ["Local deterministic checks only; not a legal compliance certification."]
  },
  "AS-CONTROL-004": {
    controlId: "AS-CONTROL-004",
    name: "Tool Registry Trust and Fingerprint Verification",
    coveredBy: ["registry-bundle"],
    evidence: ["registry.bundle.json"],
    limitations: ["Local deterministic checks only; not a legal compliance certification."]
  },
  "AS-CONTROL-005": {
    controlId: "AS-CONTROL-005",
    name: "Sandbox and Execution Constraints",
    coveredBy: ["sandbox-runtime", "bench"],
    evidence: ["benchmark report"],
    limitations: ["Local deterministic checks only; not a legal compliance certification."]
  },
  "AS-CONTROL-006": {
    controlId: "AS-CONTROL-006",
    name: "Human Approval Integrity",
    coveredBy: ["approval-runtime"],
    evidence: ["runtime trace"],
    limitations: ["Local deterministic checks only; not a legal compliance certification."]
  },
  "AS-CONTROL-007": {
    controlId: "AS-CONTROL-007",
    name: "Evidence Trace Integrity",
    coveredBy: ["verify-trace", "auditor-export"],
    evidence: ["auditor-evidence.json"],
    limitations: ["Local deterministic checks only; not a legal compliance certification."]
  },
  "AS-CONTROL-008": {
    controlId: "AS-CONTROL-008",
    name: "Adapter Certification",
    coveredBy: ["adapter-conformance"],
    evidence: ["conformance report"],
    limitations: ["Local deterministic checks only; not a legal compliance certification."]
  },
  "AS-CONTROL-009": {
    controlId: "AS-CONTROL-009",
    name: "Red-Team Scenario Coverage",
    coveredBy: ["redteam-coverage"],
    evidence: ["redteam coverage report"],
    limitations: ["Local deterministic checks only; not a legal compliance certification."]
  },
  "AS-CONTROL-010": {
    controlId: "AS-CONTROL-010",
    name: "Security Fuzz Failure-Mode Coverage",
    coveredBy: ["security-fuzz"],
    evidence: ["security-fuzz report"],
    limitations: ["Local deterministic checks only; not a legal compliance certification."]
  },
  "AS-CONTROL-011": {
    controlId: "AS-CONTROL-011",
    name: "Incident Reporting",
    coveredBy: ["incident-report"],
    evidence: ["incident-report.md"],
    limitations: ["Local deterministic checks only; not a legal compliance certification."]
  },
  "AS-CONTROL-012": {
    controlId: "AS-CONTROL-012",
    name: "Auditor Evidence Export",
    coveredBy: ["auditor-export"],
    evidence: ["auditor-evidence.json"],
    limitations: ["Local deterministic checks only; not a legal compliance certification."]
  },
  "AS-CONTROL-013": {
    controlId: "AS-CONTROL-013",
    name: "Workspace Configuration Validation",
    coveredBy: ["workspace-validate", "workspace-doctor"],
    evidence: ["workspace doctor report"],
    limitations: ["Local deterministic checks only; not a legal compliance certification."]
  },
  "AS-CONTROL-014": {
    controlId: "AS-CONTROL-014",
    name: "Release Candidate Gate",
    coveredBy: ["release-check"],
    evidence: ["release-check summary"],
    limitations: ["Local deterministic checks only; not a legal compliance certification."]
  }
};
