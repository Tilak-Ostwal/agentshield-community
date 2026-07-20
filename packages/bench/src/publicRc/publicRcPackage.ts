import { defaultPublicRcManifest } from "./publicRcManifest.js";
import { evaluatePublicRcGate } from "./publicRcGate.js";

export function generatePublicRcPackage(workspaceRoot: string) {
  const gate = evaluatePublicRcGate(workspaceRoot);
  
  return {
    manifest: defaultPublicRcManifest,
    gateResult: gate,
    ready: gate.ok
  };
}
