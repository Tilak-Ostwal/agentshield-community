import {
  assessTaintSink,
  detectTaintSources,
  labelsFromSources,
  mergeTaintLabels,
  propagation,
  resourceFromAction,
  type ActionEnvelope,
  type Capability,
  type TaintLabel,
  type TaintPropagation,
  type TaintSinkAssessment,
  type TaintSource
} from "@agentshield/core";

export interface RuntimeTaintResult {
  sources: TaintSource[];
  propagations: TaintPropagation[];
  labels: TaintLabel[];
  sink: TaintSinkAssessment;
}

export class RuntimeTaintStore {
  private readonly actionLabels = new Map<string, TaintLabel[]>();
  private readonly resourceLabels = new Map<string, TaintLabel[]>();

  public observeAction(action: ActionEnvelope, capabilities: Capability[]): RuntimeTaintResult {
    const resource = resourceFromAction(action);
    const sources = detectTaintSources(action, capabilities);
    const propagated = this.propagate(action, resource);
    const labels = mergeTaintLabels(labelsFromSources(sources), ...propagated.map((item) => item.labels));

    if (labels.length > 0) {
      this.actionLabels.set(action.actionId, labels);
      if (resource !== undefined) {
        this.resourceLabels.set(resource, mergeTaintLabels(this.resourceLabels.get(resource) ?? [], labels));
      }
    }

    return {
      sources,
      propagations: propagated,
      labels,
      sink: assessTaintSink(labels, capabilities)
    };
  }

  public getActionLabels(actionId: string): TaintLabel[] {
    return [...(this.actionLabels.get(actionId) ?? [])];
  }

  public getResourceLabels(resource: string): TaintLabel[] {
    return [...(this.resourceLabels.get(resource) ?? [])];
  }

  private propagate(action: ActionEnvelope, resource: string | undefined): TaintPropagation[] {
    const propagations: TaintPropagation[] = [];
    const input = typeof action.input === "object" && action.input !== null ? (action.input as Record<string, unknown>) : {};

    if (resource !== undefined) {
      const labels = this.resourceLabels.get(resource) ?? [];
      if (labels.length > 0) {
        propagations.push(propagation(labels, "same resource", { resource }));
      }
    }

    const previousActionId = typeof input.previousActionId === "string" ? input.previousActionId : undefined;
    if (previousActionId !== undefined) {
      const labels = this.actionLabels.get(previousActionId) ?? [];
      if (labels.length > 0) {
        propagations.push(propagation(labels, "previous action reference", { fromActionId: previousActionId }));
      }
    }

    const sourceResource = typeof input.sourceResource === "string" ? input.sourceResource : undefined;
    if (sourceResource !== undefined) {
      const labels = this.resourceLabels.get(sourceResource) ?? [];
      if (labels.length > 0) {
        propagations.push(propagation(labels, "source resource reference", { resource: sourceResource }));
      }
    }

    return propagations;
  }
}
