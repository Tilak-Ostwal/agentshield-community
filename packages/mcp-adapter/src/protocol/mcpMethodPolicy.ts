export type McpMethodDisposition = "request" | "notification" | "unsupported";

const supportedRequests = new Set(["initialize", "ping", "tools/list", "tools/call"]);
const supportedNotifications = new Set(["initialized"]);

export function classifyMcpMethod(method: string, hasId: boolean): McpMethodDisposition {
  if (supportedRequests.has(method) && hasId) {
    return "request";
  }

  if (supportedNotifications.has(method) && !hasId) {
    return "notification";
  }

  return "unsupported";
}

export function isToolExecutionMethod(method: string): boolean {
  return method === "tools/call";
}
