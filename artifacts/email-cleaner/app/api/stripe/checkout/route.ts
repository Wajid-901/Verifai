import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUncachableStripeClient } from "@/lib/stripe/client";
import { logger } from "@/lib/logger";

export async function POST(_req: NextRequest) {
  try {
    // ── Auth ──────────────────────────────────────────────────────────
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "You must be signed in to upgrade." }, { status: 401 });
    }

    // ── Price config guard ────────────────────────────────────────────
    const priceId = process.env.STRIPE_PRICE_PRO_MONTHLY;
    if (!priceId) {
      return NextResponse.json(
        { error: "Stripe pricing not configured yet. Run the seed script first." },
        { status: 500 }
      );
    }

    const admin  = createAdminClient();
    const stripe = await getUncachableStripeClient();

    // ── Get profile ───────────────────────────────────────────────────
    const { data: profile } = await admin
      .from("profiles")
      .select("stripe_customer_id, email, full_name, plan")
      .eq("id", user.id)
      .single();

    if (profile?.plan === "pro") {
      return NextResponse.json({ error: "You already have an active Pro plan." }, { status: 400 });
    }

    // ── Get or create Stripe customer ─────────────────────────────────
    let customerId = (profile?.stripe_customer_id as string | null) ?? null;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email ?? (profile?.email as string | undefined),
        name:  (profile?.full_name as string | undefined),
        metadata: { userId: user.id },
      });
      customerId = customer.id;

      await admin
        .from("profiles")
        .update({ stripe_customer_id: customerId })
        .eq("id", user.id);

      logger.info("Stripe customer created", { userId: user.id, customerId });
    }

    // ── Create Checkout session ───────────────────────────────────────
    const domain = process.env.REPLIT_DOMAINS?.split(",")[0];
    const baseUrl = domain ? `https://${domain}` : "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      success_url: `${baseUrl}/dashboard?billing=success`,
      cancel_url:  `${baseUrl}/pricing`,
      metadata: { userId: user.id },
      subscription_data: { metadata: { userId: user.id } },
      allow_promotion_codes: true,
    });

    logger.info("Checkout session created", { userId: user.id, sessionId: session.id });
    return NextResponse.json({ url: session.url });
  } catch (err) {
    logger.error("Checkout error", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create checkout session." },
      { status: 500 }
    );
  }
}
