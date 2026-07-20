import { describe, expect, it } from "vitest";
import { explainAttackGraph } from "./explainAttackGraph.js";

describe("explainAttackGraph", () => {
  it("secret exfiltration path creates critical explanation", () => {
    const graph = {
      nodes: [
        { id: "1", toolName: "fs.read", actionType: "call", decision: "allow" },
        { id: "2", toolName: "network.post", actionType: "call", decision: "allow" }
      ],
      edges: [{ from: "1", to: "2", dataType: "secret" }]
    };
    const expl = explainAttackGraph(graph) as any;
    expect(expl.category).toBe("secret_exfiltration_chain");
    expect(expl.severity).toBe("critical");
  });

  it("prompt injection chain creates prompt_injection_chain explanation", () => {
    const graph = {
      nodes: [
        { id: "1", toolName: "prompt.read", actionType: "call", decision: "allow" },
        { id: "2", toolName: "shell.execute", actionType: "call", decision: "allow" }
      ],
      edges: [{ from: "1", to: "2", dataType: "untrusted" }]
    };
    const expl = explainAttackGraph(graph) as any;
    expect(expl.category).toBe("prompt_injection_chain");
  });

  it("write-then-exec path creates write_then_execute_chain explanation", () => {
    const graph = {
      nodes: [
        { id: "1", toolName: "fs.write", actionType: "call", decision: "allow" },
        { id: "2", toolName: "shell.exec", actionType: "call", decision: "allow" }
      ],
      edges: [{ from: "1", to: "2", dataType: "executable" }]
    };
    const expl = explainAttackGraph(graph) as any;
    expect(expl.category).toBe("write_then_execute_chain");
    expect(expl.severity).toBe("critical");
  });

  it("registry drift path creates registry_drift_chain explanation", () => {
    const graph = {
      nodes: [
        { id: "1", toolName: "registry.modify", actionType: "call", decision: "allow" }
      ],
      edges: []
    };
    const expl = explainAttackGraph(graph) as any;
    expect(expl.category).toBe("registry_drift_chain");
  });

  it("sandbox block creates sandbox explanation", () => {
    const graph = {
      nodes: [
        { id: "1", toolName: "sandbox.escape", actionType: "call", decision: "allow" }
      ],
      edges: []
    };
    const expl = explainAttackGraph(graph) as any;
    expect(expl.category).toBe("sandbox_escape_attempt");
    expect(expl.severity).toBe("critical");
  });

  it("approval bypass creates approval explanation", () => {
    const graph = {
      nodes: [
        { id: "1", toolName: "approval.bypass", actionType: "call", decision: "allow" }
      ],
      edges: []
    };
    const expl = explainAttackGraph(graph) as any;
    expect(expl.category).toBe("approval_bypass_attempt");
  });

  it("evidence tamper creates evidence explanation", () => {
    const graph = {
      nodes: [
        { id: "1", toolName: "evidence.tamper", actionType: "call", decision: "allow" }
      ],
      edges: []
    };
    const expl = explainAttackGraph(graph) as any;
    expect(expl.category).toBe("evidence_tamper_detected");
  });

  it("repeated denied probe creates probing explanation", () => {
    const graph = {
      nodes: [
        { id: "1", toolName: "a", actionType: "call", decision: "deny" },
        { id: "2", toolName: "b", actionType: "call", decision: "deny" },
        { id: "3", toolName: "c", actionType: "call", decision: "deny" }
      ],
      edges: []
    };
    const expl = explainAttackGraph(graph) as any;
    expect(expl.category).toBe("repeated_denied_probe");
  });

  it("malformed graph input fails closed", () => {
    const expl = explainAttackGraph({} as any);
    expect((expl as any).error).toContain("malformed graph input");
  });

  it("explanation redacts fake secret sentinel", () => {
    const sentinel = "sk-test-REDACT-" + "ME";
    const graph = {
      nodes: [
        { id: "1", toolName: "fs.read", actionType: "call", decision: "allow", data: sentinel }
      ],
      edges: []
    };
    const expl = explainAttackGraph(graph) as any;
    expect(JSON.stringify(expl)).not.toContain(sentinel);
  });
});
