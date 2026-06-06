import { execSync } from "node:child_process";

/** Returns PIDs listening on the given port, or empty if none. */
export function getPidsOnPort(port: number): number[] {
  try {
    const output = execSync(`lsof -ti :${port}`, { encoding: "utf-8" }).trim();
    if (!output) return [];
    return output
      .split("\n")
      .map((s) => Number(s.trim()))
      .filter((n) => !Number.isNaN(n) && n > 0);
  } catch {
    return [];
  }
}

/** Stop processes bound to the port. Returns how many were stopped. */
export function freePort(port: number): number {
  const pids = getPidsOnPort(port).filter((pid) => pid !== process.pid);
  for (const pid of pids) {
    try {
      process.kill(pid, "SIGTERM");
    } catch {
      try {
        process.kill(pid, "SIGKILL");
      } catch {
        /* already gone */
      }
    }
  }
  return pids.length;
}
