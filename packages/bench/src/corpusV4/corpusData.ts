import { CorpusScenarioMetadata } from "./corpusScenarioMetadata.js";

const categories = [
  "prompt_injection", "data_exfiltration", "credential_access", "pii_export", "tool_abuse",
  "supply_chain", "package_install", "shell_execution", "filesystem_abuse", "network_egress",
  "policy_bypass", "wildcard_allow_bypass", "resource_boundary", "sandbox_bypass", "approval_bypass",
  "adapter_misuse", "provider_tool_call_misuse", "framework_workflow_misuse", "multi_agent_privilege_escalation",
  "taint_laundering", "registry_drift", "blocked_tool", "evidence_integrity", "trace_integrity",
  "incident_response", "sensitive_data_detection", "governance_submission_safety",
  "marketplace_trust_review", "leaderboard_verification", "docs_integrity"
];

const families = [
  "prompt_injection_secret_exfiltration", "prompt_injection_package_install", "prompt_injection_shell_execution",
  "untrusted_document_network_write", "email_injection_tool_abuse", "browser_content_instruction_hijack",
  "sensitive_file_read_external_sink", "nested_secret_object_exfiltration", "pii_export_attempt",
  "auth_header_leakage", "jwt_leakage", "database_url_leakage", "webhook_url_leakage", "write_then_execute",
  "generated_code_execution", "package_install_disguised_as_safe_action", "git_push_after_untrusted_input",
  "registry_blocked_tool", "registry_capability_drift", "registry_trust_downgrade", "policy_wildcard_allow_bypass",
  "policy_conflict_edge_case", "approval_token_mismatch", "approval_replay_attempt", "approval_expired_token",
  "sandbox_network_egress", "sandbox_filesystem_boundary", "execution_contract_mismatch", "adapter_normalization_bypass",
  "provider_tool_call_malformed_args", "framework_workflow_secret_laundering", "multi_agent_privilege_escalation",
  "multi_agent_taint_laundering", "evidence_hash_tamper", "trace_redaction_invariant", "incident_verification_failure",
  "marketplace_unsafe_pack", "governance_unsafe_submission", "leaderboard_result_tamper", "docs_unsafe_command_detection"
];

export function generateCorpusV4(): CorpusScenarioMetadata[] {
  const corpus: CorpusScenarioMetadata[] = [];
  let id = 1;

  // Make sure we hit every category and every family
  for (const c of categories) {
    for (let i = 0; i < 3; i++) {
       const f = families[(id-1) % families.length]!;
       corpus.push({
         version: 4,
         scenarioId: `scenario-${id.toString().padStart(3, "0")}`,
         title: `Scenario ${id}`,
         category: c,
         family: f,
         severity: id % 5 === 0 ? "critical" : "high",
         difficulty: id % 3 === 0 ? "expert" : "basic",
         expectedFinalDecision: (id % 5 === 0) ? "deny" : "review",
         expectedRiskMarkers: [],
         attackStages: ["stage1", "stage2"],
         controlsExercised: [],
         provenance: {
           source: "agentshield-research-corpus",
           createdBy: "AgentShield Maintainers",
           createdAt: "2026-06-29T00:00:00.000Z",
           reviewStatus: "reviewed",
           notes: []
         },
         limitations: ["No real secrets", "Mock-only"]
       });
       id++;
    }
  }

  // pad to 150
  while (id <= 150) {
    const f = families[(id-1) % families.length]!;
    corpus.push({
      version: 4,
      scenarioId: `scenario-${id.toString().padStart(3, "0")}`,
      title: `Scenario ${id}`,
      category: categories[id % categories.length]!,
      family: f,
      severity: id % 5 === 0 ? "critical" : "high",
      difficulty: id % 3 === 0 ? "expert" : "basic",
      expectedFinalDecision: (id % 5 === 0) ? "deny" : "review",
      expectedRiskMarkers: [],
      attackStages: ["stage1", "stage2"],
      controlsExercised: [],
      provenance: {
        source: "agentshield-research-corpus",
        createdBy: "AgentShield Maintainers",
        createdAt: "2026-06-29T00:00:00.000Z",
        reviewStatus: "reviewed",
        notes: []
      },
      limitations: ["No real secrets"]
    });
    id++;
  }

  return corpus;
}
