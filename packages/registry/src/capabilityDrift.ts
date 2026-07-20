const dangerousCapabilities = new Set([
  "shell.exec",
  "code_execution",
  "network.write",
  "network.exfiltration_risk",
  "external_side_effect",
  "filesystem.write",
  "package.install",
  "git.write",
  "git.push",
  "database.write",
  "secret.read",
  "env.read"
]);

export function capabilityHashCapabilities(capabilities: string[]): string[] {
  return [...new Set(capabilities)].sort();
}

export function addedCapabilities(expected: string[], actual: string[]): string[] {
  const expectedSet = new Set(expected);
  return capabilityHashCapabilities(actual).filter((capability) => !expectedSet.has(capability));
}

export function dangerousAddedCapabilities(expected: string[], actual: string[]): string[] {
  return addedCapabilities(expected, actual).filter((capability) => dangerousCapabilities.has(capability));
}
