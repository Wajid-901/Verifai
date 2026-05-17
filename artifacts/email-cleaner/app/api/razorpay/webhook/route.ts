import { NextRequest, NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/razorpay/client";
import { createAdminClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/logger";

// Must be Node.js runtime for crypto
export const runtime = "nodejs";

type Notes = Record<string, string>;

interface RazorpayEvent {
  event: string;
  payload?: {
    subscription?: { entity?: Record<string, unknown> };
    payment?:      { entity?: Record<string, unknown> };
  };
}

export async function POST(req: NextRequest) {
  try {
    const rawBody  = await req.text();
    const signature = req.headers.get("x-razorpay-signature") ?? "";

    if (!signature) {
      return NextResponse.json({ error: "Missing X-Razorpay-Signature" }, { status: 400 });
    }

    let isValid: boolean;
    try {
      isValid = verifyWebhookSignature(rawBody, signature);
    } catch (err) {
      logger.error("Webhook secret error", { error: err instanceof Error ? err.message : String(err) });
      return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
    }

    if (!isValid) {
      logger.warn("Razorpay webhook: invalid signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const event = JSON.parse(rawBody) as RazorpayEvent;
    const admin = createAdminClient();

    logger.info("Razorpay webhook received", { type: event.event });

    switch (event.event) {
      // ── Subscription activated / charged ───────────────────
      case "subscription.activated":
      case "subscription.charged": {
        const sub = event.payload?.subscription?.entity;
        if (!sub) break;

        const userId = (sub.notes as Notes | undefined)?.userId;
        if (!userId) {
          logger.warn("No userId in subscription notes", { subId: sub.id });
          break;
        }

        const periodEnd = sub.current_end
          ? new Date((sub.current_end as number) * 1000).toISOString()
          : null;

        await admin.from("profiles").update({ plan: "pro" }).eq("id", userId);
        await admin.from("subscriptions").upsert(
          {
            user_id:                  userId,
            razorpay_subscription_id: sub.id as string,
            razorpay_customer_id:     (sub.customer_id as string | null) ?? null,
            status:                   "active",
            plan:                     "pro",
            current_period_end:       periodEnd,
            updated_at:               new Date().toISOString(),
          },
          { onConflict: "user_id" }
        );

        if (event.event === "subscription.charged") {
          const payment = event.payload?.payment?.entity;
          if (payment) {
            const { data: existingPayment } = await admin
              .from("billing_events")
              .select("id")
              .eq("razorpay_payment_id", payment.id as string)
              .eq("event_type", "subscription.charged")
              .maybeSingle();

            if (!existingPayment) {
              await admin.from("billing_events").insert({
                user_id:                  userId,
                event_type:               "subscription.charged",
                razorpay_payment_id:      payment.id as string,
                razorpay_subscription_id: sub.id as string,
                amount:                   payment.amount as number,
                currency:                 (payment.currency as string) ?? "INR",
                status:                   "success",
              });
            } else {
              logger.info("Idempotency skip: subscription.charged already processed", { paymentId: payment.id });
            }
          }
        }

        logger.info(`Subscription ${event.event}`, { userId, subId: sub.id });
        break;
      }

      // ── Subscription cancelled / completed ─────────────────
      case "subscription.cancelled":
      case "subscription.completed": {
        const sub = event.payload?.subscription?.entity;
        if (!sub) break;

        const newStatus = event.event === "subscription.cancelled" ? "canceled" : "completed";

        // Find user either from notes or from DB
        const userId = (sub.notes as Notes | undefined)?.userId
          ?? await findUserBySubscription(admin, sub.id as string);

        if (userId) {
          await admin.from("profiles").update({ plan: "free" }).eq("id", userId);
          await admin.from("subscriptions").update({
            status:     newStatus,
            plan:       "free",
            updated_at: new Date().toISOString(),
          }).eq("user_id", userId);

          logger.info("User downgraded to Free", { userId, event: event.event });
        }
        break;
      }

      // ── Payment failed ─────────────────────────────────────
      case "payment.failed": {
        const payment = event.payload?.payment?.entity;
        if (!payment) break;

        logger.warn("Payment failed", {
          paymentId: payment.id,
          error:     (payment.error_description as string | undefined) ?? "Unknown",
        });

        // Log billing event if we can find the user
        const subId = payment.subscription_id as string | undefined;
        if (subId) {
          const userId = await findUserBySubscription(admin, subId);
          if (userId) {
            const { data: existingPayment } = await admin
              .from("billing_events")
              .select("id")
              .eq("razorpay_payment_id", payment.id as string)
              .eq("event_type", "payment.failed")
              .maybeSingle();

            if (!existingPayment) {
              await admin.from("billing_events").insert({
                user_id:                  userId,
                event_type:               "payment.failed",
                razorpay_payment_id:      payment.id as string,
                razorpay_subscription_id: subId,
                amount:                   payment.amount as number | null,
                currency:                 (payment.currency as string) ?? "INR",
                status:                   "failed",
              });
            } else {
              logger.info("Idempotency skip: payment.failed already processed", { paymentId: payment.id });
            }
          }
        }
        break;
      }

      default:
        logger.info("Unhandled Razorpay event", { type: event.event });
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    logger.error("Webhook handler error", {
      error: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
    });
    return NextResponse.json({ error: "Webhook error" }, { status: 500 });
  }
}

async function findUserBySubscription(
  admin: ReturnType<typeof createAdminClient>,
  subscriptionId: string,
): Promise<string | undefined> {
  const { data } = await admin
    .from("subscriptions")
    .select("user_id")
    .eq("razorpay_subscription_id", subscriptionId)
    .single();
  return data?.user_id as string | undefined;
}
