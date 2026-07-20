import type { TaintLabel } from "./taintTypes.js";

export interface TaintPolicyContext {
  taintLabels?: TaintLabel[];
}

export function taintMatchesAny(observed: TaintLabel[], expected: TaintLabel[]): boolean {
  return expected.some((label) => observed.includes(label));
}

export function taintMatchesAll(observed: TaintLabel[], expected: TaintLabel[]): boolean {
  return expected.every((label) => observed.includes(label));
}
