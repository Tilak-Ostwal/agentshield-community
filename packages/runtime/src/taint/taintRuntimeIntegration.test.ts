import { describe, expect, it } from "vitest";

import { createRuntimeContext } from "../context/runtimeContext.js";
import { processAction } from "../processor/actionProcessor.js";

const allowAllPolicy = {
  version: 1,
  defaultDecision: "deny",
  rules: [{ id: "allow-tool-calls", match: { actionType: "tool_call" }, decision: "allow" }]
};

function action(actionId: string, toolName: string, input?: unknown) {
  return {
    actionId,
    timestamp: "2026-06-26T00:00:00.000Z",
    actionType: "tool_call",
    toolName,
    input
  };
}

describe("taint runtime integration", () => {
  it("network.write with secret taint denies", () => {
    const context = createRuntimeContext({ policy: allowAllPolicy });
    const result = processAction(context, action("post_secret", "network.post", { url: "https://example.invalid", token: "sk-test-REDACT-ME" }));

    expect(result.decision).toBe("deny");
    expect(result.taintObserved).toEqual(expect.arrayContaining(["secret", "token"]));
  });

  it("browser_untrusted to shell.exec requires review or denies", () => {
    const context = createRuntimeContext({ policy: allowAllPolicy });

    processAction(context, action("browser", "browser.goto", { url: "https://example.invalid" }));
    const result = processAction(context, action("exec", "shell.exec", { command: "node x", previousActionId: "browser" }));

    expect(result.decision).not.toBe("allow");
    expect(result.taintObserved).toContain("browser_untrusted");
  });

  it("generated_code to shell.exec requires review or denies", () => {
    const context = createRuntimeContext({ policy: allowAllPolicy });
    const result = processAction(context, action("exec_generated", "shell.exec", { command: "node x", generatedCode: "console.log(1)" }));

    expect(result.decision).not.toBe("allow");
    expect(result.taintObserved).toEqual(expect.arrayContaining(["generated_code", "executable_content"]));
  });

  it("attack graph node includes taint labels", () => {
    const context = createRuntimeContext({ policy: allowAllPolicy });

    processAction(context, action("post_secret", "network.post", { token: "sk-test-REDACT-ME" }));

    expect(context.attackGraphEngine.snapshot().nodes[0]?.taintLabels).toContain("secret");
  });

  it("taint trace events do not contain raw fake secret", () => {
    const context = createRuntimeContext({ policy: allowAllPolicy });

    processAction(context, action("post_secret", "network.post", { token: "sk-test-REDACT-ME" }));

    const serialized = JSON.stringify(context.traceRecorder.getEvents());

    expect(serialized).toContain("taint_detected");
    expect(serialized).toContain("taint_sink_violation");
    expect(serialized).not.toContain("sk-test-REDACT-ME");
  });

  it("policy can deny by taintAny in runtime", () => {
    const context = createRuntimeContext({
      policy: {
        version: 1,
        defaultDecision: "deny",
        rules: [{ id: "deny-taint-secret", match: { taintAny: ["secret"] }, decision: "deny" }]
      }
    });

    expect(processAction(context, action("post_secret", "network.post", { token: "sk-test-REDACT-ME" })).ruleId).toBe("deny-taint-secret");
  });
});
