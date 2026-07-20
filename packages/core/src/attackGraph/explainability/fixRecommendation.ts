import { ExplanationCategory, FixRecommendation, RiskPathStep } from "./attackGraphExplanation.js";

export function generateFixRecommendations(category: ExplanationCategory, _riskPath: RiskPathStep[]): FixRecommendation[] {
  if (category === "secret_exfiltration_chain") {
    return [{
      priority: "high",
      title: "Deny secret-to-network flows",
      details: "Add or keep a deny rule for credential data sent to external network tools."
    }];
  }
  
  if (category === "prompt_injection_chain") {
    return [{
      priority: "high",
      title: "Isolate untrusted prompt sources",
      details: "Prevent tools that read untrusted prompts from sharing memory context with execution tools."
    }];
  }

  if (category === "write_then_execute_chain") {
    return [{
      priority: "high",
      title: "Prevent execution of written files",
      details: "Add rules to prevent the agent from executing files it has just written."
    }];
  }

  return [{
    priority: "info",
    title: "Review agent policies",
    details: "Ensure the policies accurately reflect the intended boundaries."
  }];
}
