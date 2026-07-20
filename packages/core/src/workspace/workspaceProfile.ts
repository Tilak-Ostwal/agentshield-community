export const workspaceProfiles = ["strict", "balanced", "dev", "enterprise"] as const;

export type WorkspaceProfile = (typeof workspaceProfiles)[number];

export interface WorkspaceProfileDefinition {
  id: WorkspaceProfile;
  description: string;
  recommendedFor: string;
  risk: "low" | "medium" | "high";
}

export const workspaceProfileDefinitions: Record<WorkspaceProfile, WorkspaceProfileDefinition> = {
  strict: {
    id: "strict",
    description: "Deny-first local security profile for release-candidate and CI evaluation.",
    recommendedFor: "security-sensitive local development and release checks",
    risk: "low"
  },
  balanced: {
    id: "balanced",
    description: "Practical profile for day-to-day local development with review gates enabled.",
    recommendedFor: "developer workflows that still require explicit review for risky actions",
    risk: "medium"
  },
  dev: {
    id: "dev",
    description: "Fast local iteration profile that may relax some release-candidate expectations.",
    recommendedFor: "temporary local experiments only",
    risk: "high"
  },
  enterprise: {
    id: "enterprise",
    description: "Strict profile intended for teams that require registry, evidence, CI, and adapter conformance checks.",
    recommendedFor: "organization-managed beta evaluations",
    risk: "low"
  }
};

export function isWorkspaceProfile(value: unknown): value is WorkspaceProfile {
  return typeof value === "string" && workspaceProfiles.includes(value as WorkspaceProfile);
}

export function getWorkspaceProfileDefinition(profile: WorkspaceProfile): WorkspaceProfileDefinition {
  return workspaceProfileDefinitions[profile];
}
