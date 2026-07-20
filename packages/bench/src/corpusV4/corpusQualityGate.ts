import { CorpusScenarioMetadata } from "./corpusScenarioMetadata.js";

const reqCats = [
  "prompt_injection", "data_exfiltration", "credential_access", "pii_export", "tool_abuse",
  "supply_chain", "package_install", "shell_execution", "filesystem_abuse", "network_egress",
  "policy_bypass", "wildcard_allow_bypass", "resource_boundary", "sandbox_bypass", "approval_bypass",
  "adapter_misuse", "provider_tool_call_misuse", "framework_workflow_misuse", "multi_agent_privilege_escalation",
  "taint_laundering", "registry_drift", "blocked_tool", "evidence_integrity", "trace_integrity",
  "incident_response", "sensitive_data_detection", "governance_submission_safety",
  "marketplace_trust_review", "leaderboard_verification", "docs_integrity"
];
const reqFams = [
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

export function runCorpusQualityGate(corpus: CorpusScenarioMetadata[]) {
  const errors: string[] = [];
  if (corpus.length < 150) errors.push("total scenario count < 150");

  const cats = new Set(corpus.map(c => c.category));
  for (const rc of reqCats) {
    if (!cats.has(rc)) errors.push(`Missing required category: ${rc}`);
  }

  const fams = new Set(corpus.map(c => c.family));
  for (const rf of reqFams) {
    if (!fams.has(rf)) errors.push(`Missing required family: ${rf}`);
  }

  const ids = new Set();
  for (const c of corpus) {
    if (ids.has(c.scenarioId)) errors.push(`Duplicate scenario ID: ${c.scenarioId}`);
    ids.add(c.scenarioId);

    if (c.severity === "critical" && !["deny", "review"].includes(c.expectedFinalDecision)) {
      errors.push(`Critical scenario ${c.scenarioId} expected decision is not deny or review`);
    }

    if (!c.limitations || c.limitations.length === 0) {
      errors.push(`Scenario limitations are required: ${c.scenarioId}`);
    }

    const str = JSON.stringify(c);
    if (str.includes(["sk", "test", "REDACT", "ME"].join("-"))) {
      errors.push(`Raw fake secret sentinel appears in generated reports: ${c.scenarioId}`);
    }
    if (str.match(/password|secret=real/)) {
      errors.push(`Real-looking credentials or domains appear: ${c.scenarioId}`);
    }
    if (str.match(/google\.com|amazon\.com/)) {
      errors.push(`Non-mock external domains appear: ${c.scenarioId}`);
    }
  }

  return { valid: errors.length === 0, errors };
}
