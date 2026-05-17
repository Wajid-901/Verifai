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

  // ── Size guard ────────────────────────────────────────────────
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

  // ── Auth + plan ───────────────────────────────────────────────
  let userId: string | null = null;
  let plan: "free" | "pro" | "anonymous" = "anonymous";
  let supabaseClient: Awaited<ReturnType<typeof createClient>> | null = null;

  try {
    supabaseClient = await createClient();
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (user) {
      userId = user.id;
      const { data: profile } = await supabaseClient
        .from("profiles").select("plan").eq("id", user.id).single();
      plan = (profile?.plan as string) === "pro" ? "pro" : "free";
    }
  } catch { /* unauthenticated */ }

  // ── Rate limiting ─────────────────────────────────────────────
  const rlKey = userId ? `validate:user:${userId}` : `validate:ip:${ip}`;
  const rlCfg = plan === "pro"  ? RATE_LIMITS.pro_validate :
                plan === "free" ? RATE_LIMITS.free_validate :
                                  RATE_LIMITS.anonymous_validate;
  const rl = checkRateLimit(rlKey, rlCfg);

  if (!rl.allowed) {
    logger.warn("Rate limit exceeded", { ip, userId, plan });
    return NextResponse.json(
      { error: `Rate limit exceeded. Try again in ${rl.retryAfter} seconds.` },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
    );
  }

  // ── Per-upload email count limit ──────────────────────────────
  const planCfg = getPlanConfig(plan);
  if (emails.length > planCfg.maxEmailsPerUpload) {
    return NextResponse.json(
      {
        error: plan === "anonymous" || plan === "free"
          ? `Free plan is limited to ${planCfg.maxEmailsPerUpload} emails per request. Upgrade to Pro for up to 100,000.`
          : `Request exceeds the maximum of ${planCfg.maxEmailsPerUpload.toLocaleString()} emails.`,
      },
      { status: 422 }
    );
  }

  // ── Daily / monthly credit check (authenticated users) ───────
  if (userId && supabaseClient) {
    const now = new Date();

    if (plan === "pro") {
      // Pro: 25,000 emails per calendar month
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const { data: monthUploads } = await supabaseClient
        .from("uploads")
        .select("total_emails")
        .eq("user_id", userId)
        .gte("created_at", monthStart);

      const usedMonth = (monthUploads ?? []).reduce(
        (s, u) => s + ((u.total_emails as number) ?? 0), 0
      );

      if (usedMonth + emails.length > 25_000) {
        return NextResponse.json(
          {
            error: `Monthly limit of 25,000 emails reached (${usedMonth.toLocaleString()} used). ` +
                   `Resets on the 1st of next month.`,
          },
          { status: 429 }
        );
      }
    } else {
      // Free: 100 emails per day
      const dayStart = new Date(now);
      dayStart.setHours(0, 0, 0, 0);
      const { data: dayUploads } = await supabaseClient
        .from("uploads")
        .select("total_emails")
        .eq("user_id", userId)
        .gte("created_at", dayStart.toISOString());

      const usedDay = (dayUploads ?? []).reduce(
        (s, u) => s + ((u.total_emails as number) ?? 0), 0
      );

      if (usedDay + emails.length > 100) {
        return NextResponse.json(
          {
            error: `Daily limit of 100 emails reached (${usedDay} used). ` +
                   `Resets at midnight. Upgrade to Pro for 25,000/month.`,
          },
          { status: 429 }
        );
      }
    }
  }

  // ── Create async job ──────────────────────────────────────────
  const jobId = crypto.randomUUID();
  createJob(jobId, userId ?? undefined);
  updateJob(jobId, { status: "processing", progress: 1 });

  logger.info("Validation job created", {
    jobId, emailCount: emails.length, plan, ip,
  });

  // Kick off background — intentionally not awaited.
  void runValidationJob(jobId, emails, plan, userId ?? undefined);

  return NextResponse.json({ jobId }, { status: 202 });
}

async function runValidationJob(
  jobId:  string,
  emails: string[],
  plan:   "free" | "pro" | "anonymous",
  userId: string | undefined,
) {
  try {
    const result = await validateEmails(
      emails,
      { removeDuplicates: true, checkMXRecords: true },
      (pct) => updateJob(jobId, { progress: pct }),
    );
    updateJob(jobId, { status: "done", progress: 100, result });
    logger.info("Validation job complete", { jobId, stats: result.stats });

    // ── Update usage tracking (best-effort) ───────────────────
    if (userId && result.total > 0) {
      const month = new Date().toISOString().slice(0, 7); // 'YYYY-MM'
      try {
        const { createAdminClient } = await import("@/lib/supabase/admin");
        const admin = createAdminClient();
        await admin.rpc("increment_usage", {
          p_user_id: userId,
          p_month:   month,
          p_emails:  result.total,
        });
      } catch (usageErr) {
        logger.warn("Failed to update usage_tracking (non-fatal)", {
          error: usageErr instanceof Error ? usageErr.message : String(usageErr),
        });
      }
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    updateJob(jobId, { status: "error", error: msg });
    logger.error("Validation job failed", { jobId, error: msg });
  }
}
