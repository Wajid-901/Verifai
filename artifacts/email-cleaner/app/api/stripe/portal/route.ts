import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUncachableStripeClient } from "@/lib/stripe/client";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();
    const { data: profile } = await admin
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .single();

    const customerId = profile?.stripe_customer_id as string | null;
    if (!customerId) {
      return NextResponse.json(
        { error: "No billing account found. Please upgrade to Pro first." },
        { status: 400 }
      );
    }

    const stripe  = await getUncachableStripeClient();
    const domain  = process.env.REPLIT_DOMAINS?.split(",")[0];
    const baseUrl = domain ? `https://${domain}` : "http://localhost:3000";

    const portalSession = await stripe.billingPortal.sessions.create({
      customer:   customerId,
      return_url: `${baseUrl}/dashboard`,
    });

    logger.info("Customer portal session created", { userId: user.id });
    return NextResponse.json({ url: portalSession.url });
  } catch (err) {
    logger.error("Portal error", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to open billing portal." },
      { status: 500 }
    );
  }
}
