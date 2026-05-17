import { NextRequest, NextResponse } from "next/server";
import { getUncachableStripeClient, getStripeWebhookSecret } from "@/lib/stripe/client";
import { createAdminClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

// Must use Node.js runtime — Edge runtime does not support Buffer
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    // Read raw body — must NOT use req.json() so Stripe signature verification works
    const rawBody = await req.arrayBuffer();
    const buf = Buffer.from(rawBody);
    const sig = req.headers.get("stripe-signature");

    if (!sig) {
      return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
    }

    const stripe        = await getUncachableStripeClient();
    const webhookSecret = await getStripeWebhookSecret();

    let event: Awaited<ReturnType<typeof stripe.webhooks.constructEventAsync>>;
    try {
      event = await stripe.webhooks.constructEventAsync(buf, sig, webhookSecret);
    } catch (err) {
      logger.error("Webhook signature verification failed", {
        error: err instanceof Error ? err.message : String(err),
      });
      return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
    }

    const admin = createAdminClient();
    logger.info("Stripe webhook received", { type: event.type });

    switch (event.type) {
      // ── 1. Checkout completed → upgrade user ───────────────────────
      case "checkout.session.completed": {
        const session      = event.data.object;
        const userId       = session.metadata?.userId;
        const customerId   = session.customer as string;
        const subscriptionId = session.subscription as string;

        if (!userId) {
          logger.warn("checkout.session.completed: no userId in session metadata", {
            sessionId: session.id,
          });
          break;
        }

        await admin
          .from("profiles")
          .update({ plan: "pro", stripe_customer_id: customerId })
          .eq("id", userId);

        await admin.from("subscriptions").upsert(
          {
            user_id:                userId,
            stripe_customer_id:     customerId,
            stripe_subscription_id: subscriptionId,
            status:                 "active",
            plan:                   "pro",
            updated_at:             new Date().toISOString(),
          },
          { onConflict: "user_id" }
        );

        logger.info("User upgraded to Pro", { userId, customerId, subscriptionId });
        break;
      }

      // ── 2. Subscription changed (status, renewal, cancellation) ────
      case "customer.subscription.updated": {
        const sub      = event.data.object;
        const isActive = ["active", "trialing"].includes(sub.status);
        const newPlan  = isActive ? "pro" : "free";
        const rawSub    = sub as unknown as { current_period_end?: number };
        const periodEnd = rawSub.current_period_end
          ? new Date(rawSub.current_period_end * 1000).toISOString()
          : null;

        // Find user by metadata.userId or by stripe_customer_id
        const metaUserId = sub.metadata?.userId as string | undefined;
        const userId = metaUserId ?? await findUserByCustomer(admin, sub.customer as string);

        if (userId) {
          await admin
            .from("profiles")
            .update({ plan: newPlan })
            .eq("id", userId);

          await admin.from("subscriptions").update({
            status:                 sub.status,
            plan:                   newPlan,
            stripe_subscription_id: sub.id,
            current_period_end:     periodEnd,
            updated_at:             new Date().toISOString(),
          }).eq("user_id", userId);

          logger.info("Subscription updated", { userId, status: sub.status, plan: newPlan });
        }
        break;
      }

      // ── 3. Subscription canceled → downgrade user ──────────────────
      case "customer.subscription.deleted": {
        const sub    = event.data.object;
        const userId = (sub.metadata?.userId as string | undefined)
          ?? await findUserByCustomer(admin, sub.customer as string);

        if (userId) {
          await admin
            .from("profiles")
            .update({ plan: "free" })
            .eq("id", userId);

          await admin.from("subscriptions").update({
            status:     "canceled",
            plan:       "free",
            updated_at: new Date().toISOString(),
          }).eq("user_id", userId);

          logger.info("Subscription canceled — user downgraded to Free", { userId });
        }
        break;
      }

      // ── 4. Payment failed ──────────────────────────────────────────
      case "invoice.payment_failed": {
        const invoice = event.data.object;
        logger.warn("Invoice payment failed", {
          customerId: invoice.customer,
          invoiceId:  invoice.id,
          amountDue:  invoice.amount_due,
        });
        break;
      }

      default:
        logger.info("Unhandled Stripe event (safe to ignore)", { type: event.type });
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    logger.error("Webhook handler error", {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}

/** Looks up a user's ID from profiles by Stripe customer ID */
async function findUserByCustomer(
  admin: ReturnType<typeof createAdminClient>,
  customerId: string
): Promise<string | undefined> {
  const { data } = await admin
    .from("profiles")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .single();
  return data?.id as string | undefined;
}
