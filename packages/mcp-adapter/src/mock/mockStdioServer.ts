import { MockMcpServer } from "./mockMcpServer.js";

export class MockStdioServer extends MockMcpServer {
  public readonly mode = "mock-stdio";
}
