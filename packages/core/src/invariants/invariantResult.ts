export interface InvariantCheck {
  id: string;
  passed: boolean;
  message: string;
}

export interface InvariantResult {
  passed: boolean;
  checks: InvariantCheck[];
}

export function invariantPass(id: string, message: string): InvariantCheck {
  return {
    id,
    passed: true,
    message
  };
}

export function invariantFail(id: string, message: string): InvariantCheck {
  return {
    id,
    passed: false,
    message
  };
}

export function summarizeInvariants(checks: InvariantCheck[]): InvariantResult {
  return {
    passed: checks.every((check) => check.passed),
    checks
  };
}
