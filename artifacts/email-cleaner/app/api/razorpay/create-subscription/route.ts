import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getRazorpayClient } from "@/lib/razorpay/client";
import { logger } from "@/lib/logger";

// Helper to safely parse Razorpay errors which often come as objects or native errors
function parseRazorpayError(err: unknown): { summary: string; raw: unknown } {
  if (!err) return { summary: "Unknown or Empty Error", raw: null };

  if (err instanceof Error) {
    return {
      summary: `${err.name || "Error"}: ${err.message}`,
      raw: { name: err.name, message: err.message, stack: err.stack },
    };
  }

  if (typeof err === "object") {
    const parts: string[] = [];
    const obj = err as Record<string, unknown>;

    // Check for root-level status code
    if (typeof obj.statusCode === "number" || typeof obj.statusCode === "string") {
      parts.push(`HTTP ${obj.statusCode}`);
    }

    // Check for standard Razorpay error code
    if (typeof obj.code === "string") {
      parts.push(`Code: ${obj.code}`);
    }

    // Check for standard Razorpay error description
    if (typeof obj.description === "string") {
      parts.push(`Description: ${obj.description}`);
    }

    // Check for nested error payload (extremely common in official Razorpay SDK)
    if (obj.error && typeof obj.error === "object") {
      const nested = obj.error as Record<string, unknown>;
      if (typeof nested.code === "string") {
        parts.push(`Nested Code: ${nested.code}`);
      }
      if (typeof nested.description === "string") {
        parts.push(`Nested Description: ${nested.description}`);
      }
      if (typeof nested.reason === "string") {
        parts.push(`Reason: ${nested.reason}`);
      }
      if (typeof nested.field === "string") {
        parts.push(`Field: ${nested.field}`);
      }
    }

    // Capture the raw object for full Vercel log visibility
    let rawJson: unknown = "[Unserializable]";
    try { rawJson = JSON.parse(JSON.stringify(obj)); } catch { /* ignore */ }

    return {
      summary: parts.length > 0 ? parts.join(" | ") : `[No standard fields — see rawError]`,
      raw: rawJson,
    };
  }

  return { summary: String(err), raw: err };
}

export async function POST() {
  let requestPhase = "init";
  try {
    requestPhase = "env-validation";
    // ── Env configuration guards ──────────────────────────────
    const planId = process.env.RAZORPAY_PLAN_ID;
    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    // Helper to safely mask secrets in logs
    const maskSecret = (str: string | undefined) => {
      if (!str) return "MISSING";
      if (str.length <= 8) return `SET (Too Short: ${str.length} chars)`;
      return `${str.slice(0, 4)}...${str.slice(-4)} (${str.length} chars)`;
    };

    // Mode-consistency guard: warn if key mode (live/test) doesn't match plan prefix
    const keyMode   = keyId?.startsWith("rzp_live_") ? "live" : keyId?.startsWith("rzp_test_") ? "test" : "unknown";
    const planMode  = planId?.startsWith("plan_") ? "(plan ID format OK)" : "(unexpected plan ID format)";

    // Diagnostic logging for production environment consistency
    logger.info("Diagnostic — Environment variable presence", {
      hasPlanId:         !!planId,
      planIdValue:       planId || "MISSING",
      keyIdMasked:       maskSecret(keyId),
      keyMode,           // "live", "test", or "unknown"
      planMode,
      keySecretMasked:   maskSecret(keySecret),
      hasSupabaseUrl:    !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseAnonKey:!!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      nodeEnv:           process.env.NODE_ENV,
    });

    if (keyMode === "test" && process.env.NODE_ENV === "production") {
      logger.warn("LIVE/TEST mismatch: using TEST Razorpay keys in production environment", {
        keyMode,
        nodeEnv: process.env.NODE_ENV,
      });
    }

    if (!planId || !keyId || !keySecret) {
      logger.error("Missing Razorpay billing configuration", {
        hasPlanId: !!planId,
        hasKeyId: !!keyId,
        hasKeySecret: !!keySecret,
        phase: requestPhase,
      });
      return NextResponse.json(
        { error: "Billing configuration is incomplete. Please contact support." },
        { status: 500 }
      );
    }

    requestPhase = "auth-check";
    // ── Auth ──────────────────────────────────────────────────
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      logger.warn("Unauthorized subscription request", { error: authError?.message });
      return NextResponse.json({ error: "You must be signed in to upgrade." }, { status: 401 });
    }

    requestPhase = "client-init";
    const admin    = createAdminClient();
    const razorpay = getRazorpayClient();

    requestPhase = "profile-fetch";
    // ── Profile ────────────────────────────────────────────────
    const { data: profile } = await admin
      .from("profiles")
      .select("plan, email, full_name, razorpay_customer_id")
      .eq("id", user.id)
      .single();

    if ((profile?.plan as string) === "pro") {
      logger.warn("User already has an active Pro plan", { userId: user.id });
      return NextResponse.json(
        { error: "You already have an active Pro plan." },
        { status: 400 }
      );
    }

    requestPhase = "customer-creation";
    // ── Get or create Razorpay customer ───────────────────────
    let customerId = (profile?.razorpay_customer_id as string | null) ?? null;

    if (!customerId) {
      const customerEmail = user.email ?? (profile?.email as string | undefined) ?? "";
      if (!customerEmail) {
        throw new Error("Cannot create Razorpay customer: user has no email address.");
      }

      logger.info("Attempting Razorpay customer creation API call", { userId: user.id });
      const customer = await razorpay.customers.create({
        name:  (profile?.full_name as string | undefined) ?? customerEmail,
        email: customerEmail,
        notes: { userId: user.id },
      } as Parameters<typeof razorpay.customers.create>[0]);

      customerId = customer.id;

      await admin
        .from("profiles")
        .update({ razorpay_customer_id: customerId })
        .eq("id", user.id);

      logger.info("Razorpay customer created successfully", { userId: user.id, customerId });
    } else {
      logger.info("Using existing Razorpay customer ID", { userId: user.id, customerId });
    }

    requestPhase = "subscription-creation";
    // ── Create subscription ────────────────────────────────────
    logger.info("Attempting Razorpay subscription creation API call", {
      userId: user.id,
      customerId,
      planId,
    });

    const subscription = await razorpay.subscriptions.create({
      plan_id:     planId,
      customer_id: customerId,
      total_count: 12,
      quantity:    1,
      notes:       { userId: user.id },
    } as Parameters<typeof razorpay.subscriptions.create>[0]);

    logger.info("Razorpay subscription created successfully", {
      userId: user.id,
      subscriptionId: subscription.id,
      status: subscription.status,
    });

    return NextResponse.json({
      subscriptionId: subscription.id,
      keyId:          keyId,
    });
  } catch (err) {
    const { summary, raw } = parseRazorpayError(err);

    // Full structured error — visible in Vercel Function Logs
    logger.error("Create subscription failed", {
      phase:    requestPhase,
      summary,
      rawError: raw,   // ← complete Razorpay API response body
    });

    // Prevent leaking sensitive raw API details in production response
    const clientMessage = process.env.NODE_ENV === "production"
      ? `Failed to create subscription during phase '${requestPhase}'. Please contact support.`
      : `${summary} (Phase: ${requestPhase})`;

    return NextResponse.json(
      { error: clientMessage },
      { status: 500 }
    );
  }
}
