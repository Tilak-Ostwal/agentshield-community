import type { Capability } from "./capabilityTypes.js";

export interface CapabilityPolicyContext {
  capabilities?: Capability[];
}

export function capabilitiesMatchAny(observed: Capability[], expected: Capability[]): boolean {
  return expected.some((capability) => observed.includes(capability));
}

export function capabilitiesMatchAll(observed: Capability[], expected: Capability[]): boolean {
  return expected.every((capability) => observed.includes(capability));
}
