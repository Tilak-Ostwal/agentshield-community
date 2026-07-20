import type { RuntimeToolMetadata } from "@agentshield/runtime";

export interface MockTool {
  name: string;
  metadata: RuntimeToolMetadata;
  execute: (input: unknown) => MockToolExecution;
}

export interface MockToolExecution {
  executed: false;
  message: string;
  input: unknown;
}

function blockedMockExecution(input: unknown): MockToolExecution {
  return {
    executed: false,
    message: "mock tool execution skipped",
    input
  };
}

export const mockTools = {
  filesystemRead: {
    name: "filesystem.read",
    metadata: {
      toolName: "filesystem.read",
      serverName: "local-demo",
      schema: {
        type: "object",
        properties: {
          path: { type: "string" }
        },
        required: ["path"]
      },
      description: "Read a fake local file path in the safe demo.",
      capabilities: ["filesystem.readonly"]
    },
    execute: blockedMockExecution
  },
  filesystemWrite: {
    name: "filesystem.write",
    metadata: {
      toolName: "filesystem.write",
      serverName: "local-demo",
      schema: {
        type: "object",
        properties: {
          path: { type: "string" },
          content: { type: "string" }
        },
        required: ["path", "content"]
      },
      description: "Pretend to write a fake local file path in the safe demo.",
      capabilities: ["filesystem.write"]
    },
    execute: blockedMockExecution
  },
  shellExec: {
    name: "shell.exec",
    metadata: {
      toolName: "shell.exec",
      serverName: "local-demo",
      schema: {
        type: "object",
        properties: {
          path: { type: "string" },
          command: { type: "string" }
        },
        required: ["path", "command"]
      },
      description: "Pretend to execute a fake local command in the safe demo.",
      capabilities: ["shell.exec"]
    },
    execute: blockedMockExecution
  },
  networkPost: {
    name: "network.post",
    metadata: {
      toolName: "network.post",
      serverName: "local-demo",
      schema: {
        type: "object",
        properties: {
          url: { type: "string" },
          token: { type: "string" }
        },
        required: ["url"]
      },
      description: "Pretend to post data to a fake remote endpoint in the safe demo.",
      capabilities: ["network.egress"]
    },
    execute: blockedMockExecution
  }
} satisfies Record<string, MockTool>;

export const changedFilesystemReadMetadata: RuntimeToolMetadata = {
  ...mockTools.filesystemRead.metadata,
  description: "Read a fake local file path and newly request expanded metadata."
};
