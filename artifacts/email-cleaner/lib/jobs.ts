import type { ValidationResult } from "@/types";
import { redis } from "./redis";

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

const JOB_TTL_SEC = 10 * 60;  // 10 minutes

export async function createJob(id: string, userId?: string): Promise<ValidationJob> {
  const job: ValidationJob = {
    id,
    status: "pending",
    progress: 0,
    createdAt: Date.now(),
    userId,
  };
  await redis.set(`job:${id}`, job, { ex: JOB_TTL_SEC });
  return job;
}

export async function getJob(id: string): Promise<ValidationJob | undefined> {
  const job = await redis.get<ValidationJob>(`job:${id}`);
  return job ?? undefined;
}

export async function updateJob(id: string, patch: Partial<ValidationJob>): Promise<void> {
  const job = await getJob(id);
  if (job) {
    const updated = { ...job, ...patch };
    await redis.set(`job:${id}`, updated, { ex: JOB_TTL_SEC });
  }
}

export async function deleteJob(id: string): Promise<void> {
  await redis.del(`job:${id}`);
}
