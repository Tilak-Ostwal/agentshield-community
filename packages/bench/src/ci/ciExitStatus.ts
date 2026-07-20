export type CiStatus = "pass" | "fail";

export function ciExitCode(status: CiStatus): 0 | 1 {
  return status === "pass" ? 0 : 1;
}
