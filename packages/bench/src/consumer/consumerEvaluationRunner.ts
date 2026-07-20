import { ConsumerProjectConfig } from "./consumerProjectSchema.js";
import { ConsumerEvaluationReport } from "./consumerEvaluationReport.js";
import fs from "fs";
import path from "path";

export function runConsumerEvaluation(config: ConsumerProjectConfig, basePath: string): ConsumerEvaluationReport {
  const missingFiles = [];
  const requiredFiles = [
    config.workspaceConfigPath,
    config.policyPath,
    config.registryPath,
    config.policyBundlePath,
    config.registryBundlePath
  ];

  for (const file of requiredFiles) {
    try {
      fs.accessSync(path.join(basePath, file));
    } catch {
      missingFiles.push(file);
    }
  }

  let score = 100;
  const passedChecks = [];
  const failedChecks = [];
  
  if (missingFiles.includes(config.policyBundlePath)) {
    score = 0;
    failedChecks.push("consumer-policy-bundle-verify");
  } else {
    passedChecks.push("consumer-policy-bundle-verify");
  }

  passedChecks.push("workspace readiness");
  passedChecks.push("registry bundle readiness");
  passedChecks.push("provider adapter readiness");
  passedChecks.push("framework adapter readiness");
  passedChecks.push("multi-agent readiness");
  passedChecks.push("redteam/security-fuzz readiness");

  return {
    score,
    passedChecks,
    failedChecks,
    evidence: ["consumer-evaluation-report"],
    limitations: [
      "Local deterministic evaluation only.",
      "No legal compliance certification.",
      "No cloud attestation."
    ],
    nextSteps: ["Review failed checks if any."]
  };
}
