import {
  createToolFingerprint,
  hasFingerprintChanged,
  type ToolFingerprint
} from "@agentshield/core";

export interface RuntimeToolMetadata {
  toolName: string;
  serverName: string;
  schema: unknown;
  description: string;
  capabilities: string[];
}

export type FingerprintStatus = "new" | "unchanged" | "changed";

export interface FingerprintCheckResult {
  status: FingerprintStatus;
  fingerprint: ToolFingerprint;
  previousFingerprint?: ToolFingerprint;
}

export class InMemoryFingerprintStore {
  private readonly fingerprints = new Map<string, ToolFingerprint>();

  public checkAndStore(metadata: RuntimeToolMetadata): FingerprintCheckResult {
    const fingerprint = createToolFingerprint(metadata);
    const key = this.keyFor(fingerprint);
    const previousFingerprint = this.fingerprints.get(key);

    this.fingerprints.set(key, fingerprint);

    if (previousFingerprint === undefined) {
      return {
        status: "new",
        fingerprint
      };
    }

    if (hasFingerprintChanged(previousFingerprint, fingerprint)) {
      return {
        status: "changed",
        fingerprint,
        previousFingerprint
      };
    }

    return {
      status: "unchanged",
      fingerprint,
      previousFingerprint
    };
  }

  public get(toolName: string, serverName: string): ToolFingerprint | undefined {
    return this.fingerprints.get(`${serverName}:${toolName}`);
  }

  private keyFor(fingerprint: ToolFingerprint): string {
    return `${fingerprint.serverName}:${fingerprint.toolName}`;
  }
}
