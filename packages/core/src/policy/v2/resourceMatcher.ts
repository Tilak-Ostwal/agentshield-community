import type { ActionEnvelope } from "../../action/actionEnvelope.js";
import type { ResourceScope } from "../../capabilities/capabilityTypes.js";

export interface ObservedResource {
  type: ResourceScope["type"];
  value: string;
}

export type ResourceMatchDecision = "match" | "no_match" | "uncertain";

export interface ResourceMatchResult {
  decision: ResourceMatchDecision;
  reason: string;
}

function inputRecord(action: ActionEnvelope): Record<string, unknown> {
  return typeof action.input === "object" && action.input !== null ? (action.input as Record<string, unknown>) : {};
}

export function inferObservedResources(action: ActionEnvelope): ObservedResource[] {
  const input = inputRecord(action);
  const resources: ObservedResource[] = [];
  const toolName = action.toolName ?? "";
  const type =
    toolName.startsWith("filesystem.") ? "filesystem" :
    toolName.startsWith("network.") ? "network" :
    toolName.startsWith("git.") ? "git" :
    toolName.startsWith("browser.") ? "browser" :
    toolName.startsWith("database.") ? "database" :
    toolName.startsWith("env.") ? "env" :
    toolName.startsWith("secret.") ? "secret" :
    undefined;

  const candidate = input.path ?? input.url ?? input.resource ?? input.key ?? input.name;

  if (type !== undefined && typeof candidate === "string" && candidate.length > 0) {
    resources.push({ type, value: candidate });
  }

  return resources;
}

function globMatches(pattern: string, value: string): boolean {
  if (pattern === "*" || pattern === "**") {
    return true;
  }

  if (pattern.endsWith("/**")) {
    const prefix = pattern.slice(0, -3);
    return value === prefix || value.startsWith(`${prefix}/`);
  }

  if (pattern.endsWith("*")) {
    return value.startsWith(pattern.slice(0, -1));
  }

  return value === pattern;
}

function anyPatternMatches(patterns: string[] | undefined, value: string): boolean {
  return patterns?.some((pattern) => globMatches(pattern, value)) ?? false;
}

export function matchResourceScope(scope: ResourceScope, observed: ObservedResource[]): ResourceMatchResult {
  const resources = observed.filter((resource) => resource.type === scope.type);

  if (resources.length === 0) {
    return { decision: "uncertain", reason: `no observed ${scope.type} resource` };
  }

  if (resources.some((resource) => anyPatternMatches(scope.deny, resource.value))) {
    return { decision: "no_match", reason: "resource matched deny scope" };
  }

  if (scope.allow === undefined || scope.allow.length === 0) {
    return { decision: "match", reason: "resource type matched without allow scope" };
  }

  if (resources.some((resource) => anyPatternMatches(scope.allow, resource.value))) {
    return { decision: "match", reason: "resource matched allow scope" };
  }

  return { decision: "no_match", reason: "resource outside allow scope" };
}
