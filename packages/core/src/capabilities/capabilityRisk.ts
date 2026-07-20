import type { Capability, CapabilityRiskLevel } from "./capabilityTypes.js";

export interface CapabilityRiskAssessment {
  riskLevel: CapabilityRiskLevel;
  reasons: string[];
}

function includes(capabilities: Capability[], capability: Capability): boolean {
  return capabilities.includes(capability);
}

export function classifyCapabilityRisk(capabilities: Capability[], options: { sensitivePath?: boolean } = {}): CapabilityRiskAssessment {
  const reasons: string[] = [];

  if (includes(capabilities, "shell.exec") || includes(capabilities, "code_execution") || includes(capabilities, "package.install")) {
    reasons.push("code execution capability");
    return { riskLevel: "critical", reasons };
  }

  if (includes(capabilities, "secret.read") && includes(capabilities, "network.write")) {
    reasons.push("secret read with network write");
    return { riskLevel: "critical", reasons };
  }

  if (includes(capabilities, "network.exfiltration_risk")) {
    reasons.push("network exfiltration risk");
    return { riskLevel: includes(capabilities, "secret.read") ? "critical" : "high", reasons };
  }

  if (includes(capabilities, "external_side_effect")) {
    reasons.push("external side effect");
    return { riskLevel: "high", reasons };
  }

  if (includes(capabilities, "filesystem.read") && options.sensitivePath === true) {
    reasons.push("sensitive filesystem read");
    return { riskLevel: "high", reasons };
  }

  if (includes(capabilities, "filesystem.write")) {
    reasons.push("filesystem write");
    return { riskLevel: "medium", reasons };
  }

  if (includes(capabilities, "filesystem.delete")) {
    reasons.push("filesystem delete");
    return { riskLevel: "high", reasons };
  }

  return { riskLevel: "low", reasons };
}
