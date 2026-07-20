import type { RuntimeToolMetadata } from "@agentshield/runtime";

export interface MockMcpTool {
  name: string;
  description: string;
  inputSchema: unknown;
  metadata: RuntimeToolMetadata;
}

export interface MockMcpToolCall {
  toolName: string;
  arguments: Record<string, unknown>;
}

export interface MockMcpToolResult {
  content: Array<{
    type: "text";
    text: string;
  }>;
  mockOnly: true;
}

function toolMetadata(toolName: string, description: string, schema: unknown, capabilities: string[]): RuntimeToolMetadata {
  return {
    toolName,
    serverName: "mock-mcp-server",
    schema,
    description,
    capabilities
  };
}

const pathSchema = {
  type: "object",
  properties: {
    path: { type: "string" }
  },
  required: ["path"]
};

export class MockMcpServer {
  private readonly calls = new Map<string, number>();
  private readonly tools: MockMcpTool[] = [
    {
      name: "filesystem.read",
      description: "Read a fake local path without touching disk.",
      inputSchema: pathSchema,
      metadata: toolMetadata("filesystem.read", "Read a fake local path without touching disk.", pathSchema, [
        "filesystem.read"
      ])
    },
    {
      name: "filesystem.write",
      description: "Pretend to write a fake local path without touching disk.",
      inputSchema: {
        type: "object",
        properties: {
          path: { type: "string" },
          content: { type: "string" }
        },
        required: ["path", "content"]
      },
      metadata: toolMetadata(
        "filesystem.write",
        "Pretend to write a fake local path without touching disk.",
        {
          type: "object",
          properties: {
            path: { type: "string" },
            content: { type: "string" }
          },
          required: ["path", "content"]
        },
        ["filesystem.write"]
      )
    },
    {
      name: "shell.exec",
      description: "Pretend to execute a command without invoking a shell.",
      inputSchema: {
        type: "object",
        properties: {
          path: { type: "string" },
          command: { type: "string" }
        },
        required: ["command"]
      },
      metadata: toolMetadata(
        "shell.exec",
        "Pretend to execute a command without invoking a shell.",
        {
          type: "object",
          properties: {
            path: { type: "string" },
            command: { type: "string" }
          },
          required: ["command"]
        },
        ["shell.exec", "code_execution"]
      )
    },
    {
      name: "network.post",
      description: "Pretend to post data without network access.",
      inputSchema: {
        type: "object",
        properties: {
          url: { type: "string" },
          token: { type: "string" }
        },
        required: ["url"]
      },
      metadata: toolMetadata(
        "network.post",
        "Pretend to post data without network access.",
        {
          type: "object",
          properties: {
            url: { type: "string" },
            token: { type: "string" }
          },
          required: ["url"]
        },
        ["network.write", "network.exfiltration_risk", "external_side_effect"]
      )
    }
  ];

  public listTools(): MockMcpTool[] {
    return this.tools.map((tool) => ({
      ...tool,
      metadata: {
        ...tool.metadata,
        capabilities: [...tool.metadata.capabilities]
      }
    }));
  }

  public getToolMetadata(toolName: string): RuntimeToolMetadata | undefined {
    const tool = this.tools.find((candidate) => candidate.name === toolName);

    if (tool === undefined) {
      return undefined;
    }

    return {
      ...tool.metadata,
      capabilities: [...tool.metadata.capabilities]
    };
  }

  public callTool(call: MockMcpToolCall): MockMcpToolResult {
    this.calls.set(call.toolName, this.callCount(call.toolName) + 1);

    return {
      content: [
        {
          type: "text",
          text: `mock result for ${call.toolName}`
        }
      ],
      mockOnly: true
    };
  }

  public callCount(toolName: string): number {
    return this.calls.get(toolName) ?? 0;
  }
}
