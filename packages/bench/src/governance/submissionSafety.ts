export interface SafetyViolation {
  rule: string;
  detail: string;
}

export function checkSubmissionSafety(content: string, type: string): SafetyViolation[] {
  const violations: SafetyViolation[] = [];
  
  const unsafeCommands = [
    "npm publish", "pnpm publish", "yarn publish",
    "git push", "git tag",
    "curl ", "irm ", "iwr ", "Invoke-WebRequest",
    "aws deploy", "gcloud app deploy", "az webapp up"
  ];
  
  for (const cmd of unsafeCommands) {
    if (content.includes(cmd)) {
      violations.push({ rule: "no-unsafe-commands", detail: `Command found: ${cmd}` });
    }
  }
  
  if (content.match(/sk-[a-zA-Z0-9]{32,}/) || content.match(/ghp_[a-zA-Z0-9]{36,}/)) {
    violations.push({ rule: "no-real-secrets", detail: "Real-looking secret found" });
  }
  
  if (type === "benchmark_submission") {
    if (!content.includes('category')) violations.push({ rule: "benchmark-requires-category", detail: "Missing category" });
    if (!content.includes('severity')) violations.push({ rule: "benchmark-requires-severity", detail: "Missing severity" });
    if (!content.includes('expectedDecision')) violations.push({ rule: "benchmark-requires-expected-decision", detail: "Missing expectedDecision" });
    if (!content.includes('rationale')) violations.push({ rule: "benchmark-requires-rationale", detail: "Missing rationale" });
  }

  if (type === "policy_pack_submission") {
    if (!content.includes("audit expectations") && !content.includes("test expectations")) {
      violations.push({ rule: "policy-pack-requires-tests", detail: "Missing audit/test expectations" });
    }
  }

  if (type === "adapter_certification") {
    if (!content.includes("conformance fixtures")) {
      violations.push({ rule: "adapter-requires-fixtures", detail: "Missing conformance fixtures" });
    }
  }

  return violations;
}
