import { classifyCapabilityRisk, inferCapabilities, type ActionEnvelope, type Capability, type CapabilityRiskAssessment } from "@agentshield/core";

import type { RuntimeToolMetadata } from "../fingerprint/inMemoryFingerprintStore.js";

export interface RuntimeCapabilityContext {
  capabilitiesObserved: Capability[];
  risk: CapabilityRiskAssessment;
}

function toolMetadataRecord(toolMetadata: RuntimeToolMetadata | undefined): Record<string, unknown> | undefined {
  if (toolMetadata === undefined) {
    return undefined;
  }

  return {
    tool: {
      toolName: toolMetadata.toolName,
      serverName: toolMetadata.serverName,
      schema: toolMetadata.schema,
      description: toolMetadata.description,
      capabilities: toolMetadata.capabilities
    }
  };
}

function isSensitivePath(action: ActionEnvelope): boolean {
  const input = typeof action.input === "object" && action.input !== null ? (action.input as Record<string, unknown>) : {};
  const path = typeof input.path === "string" ? input.path.toLowerCase() : "";
  return [".env", "id_rsa", "credentials", "token", "secret"].some((part) => path.includes(part));
}

export function buildRuntimeCapabilityContext(
  action: ActionEnvelope,
  toolMetadata: RuntimeToolMetadata | undefined
): RuntimeCapabilityContext {
  const metadata = action.metadata ?? toolMetadataRecord(toolMetadata);
  const capabilitiesObserved = inferCapabilities({
    actionType: action.actionType,
    ...(action.toolName === undefined ? {} : { toolName: action.toolName }),
    input: action.input,
    ...(metadata === undefined ? {} : { metadata })
  });

  return {
    capabilitiesObserved,
    risk: classifyCapabilityRisk(capabilitiesObserved, { sensitivePath: isSensitivePath(action) })
  };
}
