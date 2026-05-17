import { NextRequest, NextResponse } from "next/server";
import { getJob } from "@/lib/jobs";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;

  if (!jobId || typeof jobId !== "string") {
    return NextResponse.json({ error: "Missing jobId" }, { status: 400 });
  }

  const job = await getJob(jobId);

  if (!job) {
    return NextResponse.json({ error: "Job not found or expired" }, { status: 404 });
  }

  return NextResponse.json({
    jobId:    job.id,
    status:   job.status,
    progress: job.progress,
    result:   job.result,
    error:    job.error,
  });
}
