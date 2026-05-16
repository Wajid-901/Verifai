import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { validateEmails } from "@/lib/validation";
import { checkRateLimit, getClientIP, RATE_LIMITS } from "@/lib/rate-limit";
import { getPlanConfig } from "@/lib/plans";
import { createJob, updateJob } from "@/lib/jobs";
import { logger } from "@/lib/logger";

const MAX_BODY_BYTES = 5 * 1024 * 1024; // 5 MB

export async function POST(req: NextRequest) {
  const ip = getClientIP(req);

  // ── Size guard ───────────────────────────────────────────────────────
  const contentLength = req.headers.get("content-length");
  if (contentLength && parseInt(contentLength) > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "Request too large. Maximum 5 MB." }, { status: 413 });
  }

  let body: { emails?: unknown };
  try {
    body = await req.json() as { emails?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body.emails || !Array.isArray(body.emails)) {
    return NextResponse.json(
      { error: "Invalid request: expected { emails: string[] }" },
      { status: 400 }
    );
  }
  const emails = (body.emails as unknown[]).filter((e): e is string => typeof e === "string");

  // ── Auth + plan ───────────────────────────────────────────────────────
  let userId: string | null = null;
  let plan: "free" | "pro" | "anonymous" = "anonymous";

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      userId = user.id;
      const { data: profile } = await supabase
        .from("profiles").select("plan").eq("id", user.id).single();
      plan = profile?.plan === "pro" ? "pro" : "free";
    }
  } catch { /* unauthenticated */ }

  // ── Rate limiting ─────────────────────────────────────────────────────
  const rlKey = userId ? `validate:user:${userId}` : `validate:ip:${ip}`;
  const rlCfg = plan === "pro"       ? RATE_LIMITS.pro_validate :
                plan === "free"      ? RATE_LIMITS.free_validate :
                                       RATE_LIMITS.anonymous_validate;
  const rl = checkRateLimit(rlKey, rlCfg);

  if (!rl.allowed) {
    logger.warn("Rate limit exceeded", { ip, userId, plan });
    return NextResponse.json(
      { error: `Rate limit exceeded. Try again in ${rl.retryAfter} seconds.` },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
    );
  }

  // ── Email count limit ─────────────────────────────────────────────────
  const planCfg = getPlanConfig(plan);
  if (emails.length > planCfg.maxEmailsPerUpload) {
    return NextResponse.json(
      {
        error: plan === "anonymous" || plan === "free"
          ? `Free plan is limited to ${planCfg.maxEmailsPerUpload} emails per request. Upgrade to Pro for unlimited.`
          : `Request exceeds the maximum of ${planCfg.maxEmailsPerUpload.toLocaleString()} emails.`,
      },
      { status: 422 }
    );
  }

  // ── Create async job ──────────────────────────────────────────────────
  const jobId = crypto.randomUUID();
  createJob(jobId, userId ?? undefined);
  updateJob(jobId, { status: "processing", progress: 1 });

  logger.info("Validation job created", { jobId, emailCount: emails.length, plan, ip });

  // Kick off background processing — intentionally not awaited.
  // Works correctly on Replit's persistent Node.js process.
  void runValidationJob(jobId, emails, plan);

  return NextResponse.json({ jobId }, { status: 202 });
}

async function runValidationJob(
  jobId: string,
  emails: string[],
  plan: "free" | "pro" | "anonymous",
) {
  try {
    const result = await validateEmails(
      emails,
      { removeDuplicates: true, checkMXRecords: true },
      (pct) => updateJob(jobId, { progress: pct }),
    );
    updateJob(jobId, { status: "done", progress: 100, result });
    logger.info("Validation job complete", { jobId, stats: result.stats });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    updateJob(jobId, { status: "error", error: msg });
    logger.error("Validation job failed", { jobId, error: msg });
  }
}
