import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getRazorpayClient } from "@/lib/razorpay/client";
import { logger } from "@/lib/logger";

// Helper to safely parse Razorpay errors which often come as objects
function parseRazorpayError(err: unknown) {
  if (err instanceof Error) {
    return err.message;
  }
  if (typeof err === "object" && err !== null) {
    // Razorpay standard error shape
    const rzpErr = err as { error?: { description?: string; code?: string }, statusCode?: number };
    if (rzpErr.error?.description) {
      return `[${rzpErr.statusCode || "UNKNOWN"}] ${rzpErr.error.code ? rzpErr.error.code + ": " : ""}${rzpErr.error.description}`;
    }
    // Fallback serialization for objects
    try {
      return JSON.stringify(err);
    } catch {
      return "[Unserializable Error Object]";
    }
  }
  return String(err);
}

export async function POST() {
  let requestPhase = "init";
  try {
    requestPhase = "env-validation";
    // ── Env configuration guards ──────────────────────────────
    const planId = process.env.RAZORPAY_PLAN_ID;
    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

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
      return NextResponse.json(
        { error: "You already have an active Pro plan." },
        { status: 400 }
      );
    }

    requestPhase = "customer-creation";
    // ── Get or create Razorpay customer ───────────────────────
    let customerId = (profile?.razorpay_customer_id as string | null) ?? null;

    if (!customerId) {
      const customer = await razorpay.customers.create({
        name:  (profile?.full_name as string | undefined) ?? (user.email ?? "Customer"),
        email: user.email ?? (profile?.email as string | undefined) ?? "",
        notes: { userId: user.id },
      } as Parameters<typeof razorpay.customers.create>[0]);

      customerId = customer.id;

      await admin
        .from("profiles")
        .update({ razorpay_customer_id: customerId })
        .eq("id", user.id);

      logger.info("Razorpay customer created", { userId: user.id, customerId });
    }

    requestPhase = "subscription-creation";
    // ── Create subscription ────────────────────────────────────
    const subscription = await razorpay.subscriptions.create({
      plan_id:     planId,
      customer_id: customerId,
      total_count: 12,
      quantity:    1,
      notes:       { userId: user.id },
    } as Parameters<typeof razorpay.subscriptions.create>[0]);

    logger.info("Razorpay subscription created", {
      userId: user.id,
      subscriptionId: subscription.id,
      status: subscription.status,
    });

    return NextResponse.json({
      subscriptionId: subscription.id,
      keyId:          keyId,
    });
  } catch (err) {
    const serializedError = parseRazorpayError(err);
    logger.error("Create subscription error", {
      phase: requestPhase,
      error: serializedError,
    });
    
    // Prevent leaking API details to the client in production
    const clientMessage = process.env.NODE_ENV === "production" 
      ? "Failed to create subscription. Please try again."
      : serializedError;

    return NextResponse.json(
      { error: clientMessage },
      { status: 500 }
    );
  }
}
