import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyPaymentSignature } from "@/lib/razorpay/client";
import { logger } from "@/lib/logger";

interface VerifyBody {
  razorpay_payment_id:      string;
  razorpay_subscription_id: string;
  razorpay_signature:       string;
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json() as VerifyBody;
    const { razorpay_payment_id, razorpay_subscription_id, razorpay_signature } = body;

    if (!razorpay_payment_id || !razorpay_subscription_id || !razorpay_signature) {
      return NextResponse.json({ error: "Missing payment verification fields." }, { status: 400 });
    }

    const isValid = verifyPaymentSignature(
      razorpay_payment_id,
      razorpay_subscription_id,
      razorpay_signature,
    );

    if (!isValid) {
      logger.warn("Invalid payment signature on verify", { userId: user.id });
      return NextResponse.json({ error: "Payment signature is invalid." }, { status: 400 });
    }

    const admin = createAdminClient();

    // Upgrade the user optimistically — webhook will settle final state
    await admin.from("profiles").update({ plan: "pro" }).eq("id", user.id);

    await admin.from("subscriptions").upsert(
      {
        user_id:                  user.id,
        razorpay_subscription_id: razorpay_subscription_id,
        status:                   "active",
        plan:                     "pro",
        updated_at:               new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

    await admin.from("billing_events").insert({
      user_id:                  user.id,
      event_type:               "payment.captured",
      razorpay_payment_id:      razorpay_payment_id,
      razorpay_subscription_id: razorpay_subscription_id,
      status:                   "success",
      currency:                 "INR",
    });

    logger.info("Payment verified — user upgraded to Pro", {
      userId:         user.id,
      subscriptionId: razorpay_subscription_id,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error("Verify error", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json({ error: "Verification failed." }, { status: 500 });
  }
}
