import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getRazorpayClient } from "@/lib/razorpay/client";
import { logger } from "@/lib/logger";

export async function POST() {
  try {
    // ── Auth ──────────────────────────────────────────────────
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "You must be signed in to upgrade." }, { status: 401 });
    }

    // ── Plan ID guard ──────────────────────────────────────────
    const planId = process.env.RAZORPAY_PLAN_ID;
    if (!planId) {
      return NextResponse.json(
        { error: "Razorpay plan not configured yet. Run the seed script first." },
        { status: 500 }
      );
    }

    const admin    = createAdminClient();
    const razorpay = getRazorpayClient();

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
    });

    return NextResponse.json({
      subscriptionId: subscription.id,
      keyId:          process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    logger.error("Create subscription error", {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create subscription." },
      { status: 500 }
    );
  }
}
