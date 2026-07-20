export function classifyProductionBoundary(component: string, capabilities: string[]): string {
  const caps = `${component} ${capabilities.join(" ")}`.toLowerCase();
  
  if (caps.includes("local signing") || caps.includes("mock signing")) {
    return "mockOnly";
  }

  if (caps.includes("mock demo") || caps.includes("local mock")) {
    return "mockOnly";
  }

  if (caps.includes("compliance certification") || caps.includes("soc2") || caps.includes("iso")) {
    return "forbidden"; // Production boundary forbids compliance certification claims
  }

  if (caps.includes("local deterministic") || caps.includes("evidence")) {
    return "betaReady";
  }

  return "futureProductionWork";
}
