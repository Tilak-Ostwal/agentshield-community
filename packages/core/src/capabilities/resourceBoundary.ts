import type { ResourceScope } from "./capabilityTypes.js";

export interface ResourceBoundaryResult {
  allowed: boolean;
  reason: string;
}

function matches(patterns: string[] | undefined, resource: string): boolean {
  return (patterns ?? []).some((pattern) => resource.includes(pattern));
}

export function evaluateResourceBoundary(scope: ResourceScope, resource: string): ResourceBoundaryResult {
  if (matches(scope.deny, resource)) {
    return { allowed: false, reason: "resource matched deny boundary" };
  }

  if (scope.allow !== undefined && scope.allow.length > 0 && !matches(scope.allow, resource)) {
    return { allowed: false, reason: "resource did not match allow boundary" };
  }

  return { allowed: true, reason: "resource boundary allowed" };
}
