import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getRazorpayClient } from "@/lib/razorpay/client";
import { logger } from "@/lib/logger";

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();
    const { data: sub } = await admin
      .from("subscriptions")
      .select("razorpay_subscription_id, status")
      .eq("user_id", user.id)
      .single();

    if (!sub?.razorpay_subscription_id) {
      return NextResponse.json({ error: "No active subscription found." }, { status: 400 });
    }

    if ((sub.status as string) === "canceled") {
      return NextResponse.json({ error: "Subscription is already canceled." }, { status: 400 });
    }

    const razorpay = getRazorpayClient();
    // true = cancel at end of current billing period (graceful)
    await razorpay.subscriptions.cancel(sub.razorpay_subscription_id as string, true);

    logger.info("Subscription cancel requested (end of period)", {
      userId:         user.id,
      subscriptionId: sub.razorpay_subscription_id,
    });

    return NextResponse.json({
      success: true,
      message: "Your subscription will cancel at the end of the current billing period. You keep Pro access until then.",
    });
  } catch (err) {
    logger.error("Cancel subscription error", {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to cancel subscription." },
      { status: 500 }
    );
  }
}
