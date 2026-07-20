# Attack Graph Explainability

AgentShield can explain multi-step agent risks in a clear, deterministic, auditor-friendly way.

This module helps teams prove:
- What happened?
- Which tool call started the risk?
- Which later tool call became dangerous?
- What data flowed between steps?
- Why was the decision deny/review/allow?
- What should the developer fix?

## No LLM Usage
AgentShield explainability is completely local and rule-based. It does not use LLMs, ensuring there are no hallucination risks in security explanations.

## Usage
```sh
agentshield explain-graph examples/attack-graph-explain/sample-attack-graph.json
```
