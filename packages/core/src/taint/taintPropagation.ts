import type { TaintLabel, TaintPropagation, TaintSource } from "./taintTypes.js";

export function uniqueTaintLabels(labels: TaintLabel[]): TaintLabel[] {
  return [...new Set(labels)].sort();
}

export function labelsFromSources(sources: TaintSource[]): TaintLabel[] {
  return uniqueTaintLabels(sources.map((source) => source.label));
}

export function mergeTaintLabels(...groups: TaintLabel[][]): TaintLabel[] {
  return uniqueTaintLabels(groups.flat());
}

export function propagation(labels: TaintLabel[], reason: string, options: { fromActionId?: string; resource?: string } = {}): TaintPropagation {
  return {
    labels: uniqueTaintLabels(labels),
    reason,
    ...(options.fromActionId === undefined ? {} : { fromActionId: options.fromActionId }),
    ...(options.resource === undefined ? {} : { resource: options.resource })
  };
}
