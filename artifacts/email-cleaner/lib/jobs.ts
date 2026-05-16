import type { ValidationResult } from "@/types";

export type JobStatus = "pending" | "processing" | "done" | "error";

export interface ValidationJob {
  id: string;
  status: JobStatus;
  /** 0–100 */
  progress: number;
  result?: ValidationResult;
  error?: string;
  createdAt: number;
  userId?: string;
}

/** Module-level store — survives across requests in a persistent Node.js process.
 *  In serverless or multi-instance environments, swap this for Redis/Upstash. */
const jobs = new Map<string, ValidationJob>();

const JOB_TTL_MS = 10 * 60 * 1000;  // 10 minutes
const MAX_JOBS   = 1_000;

function cleanup() {
  const now = Date.now();
  const cutoff = now - JOB_TTL_MS;
  for (const [id, job] of jobs) {
    if (job.createdAt < cutoff) jobs.delete(id);
  }
  // Hard cap — remove oldest if still over limit
  if (jobs.size > MAX_JOBS) {
    const sorted = [...jobs.entries()].sort((a, b) => a[1].createdAt - b[1].createdAt);
    for (let i = 0; i < sorted.length - MAX_JOBS; i++) {
      jobs.delete(sorted[i][0]);
    }
  }
}

export function createJob(id: string, userId?: string): ValidationJob {
  cleanup();
  const job: ValidationJob = {
    id,
    status: "pending",
    progress: 0,
    createdAt: Date.now(),
    userId,
  };
  jobs.set(id, job);
  return job;
}

export function getJob(id: string): ValidationJob | undefined {
  return jobs.get(id);
}

export function updateJob(id: string, patch: Partial<ValidationJob>): void {
  const job = jobs.get(id);
  if (job) Object.assign(job, patch);
}

export function deleteJob(id: string): void {
  jobs.delete(id);
}
