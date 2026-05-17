import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Plan } from "@/types";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now        = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const dayStart   = new Date(now.setHours(0, 0, 0, 0)).toISOString();

    const [profileResult, subResult, monthResult, dayResult, billingResult] = await Promise.all([
      supabase
        .from("profiles")
        .select("plan, razorpay_customer_id")
        .eq("id", user.id)
        .single(),

      supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle(),

      supabase
        .from("uploads")
        .select("total_emails")
        .eq("user_id", user.id)
        .gte("created_at", monthStart),

      supabase
        .from("uploads")
        .select("total_emails")
        .eq("user_id", user.id)
        .gte("created_at", dayStart),

      supabase
        .from("billing_events")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10),
    ]);

    const plan       = (profileResult.data?.plan as Plan | null) ?? "free";
    const isPro      = plan === "pro";
    const monthUsed  = (monthResult.data ?? []).reduce((s, u) => s + ((u.total_emails as number) ?? 0), 0);
    const dayUsed    = (dayResult.data ?? []).reduce((s, u) => s + ((u.total_emails as number) ?? 0), 0);
    const used       = isPro ? monthUsed : dayUsed;
    const limit      = isPro ? 25_000 : 100;
    const remaining  = Math.max(0, limit - used);
    const pct        = Math.min(100, Math.round((used / limit) * 100));

    return NextResponse.json({
      plan,
      usage: {
        type:      isPro ? "monthly" : "daily",
        limit,
        used,
        remaining,
        pct,
        resets:    isPro ? "first of next month" : "tomorrow at midnight",
      },
      subscription:  subResult.data ?? null,
      billingEvents: billingResult.data ?? [],
      hasCustomer:   !!(profileResult.data?.razorpay_customer_id),
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load usage." },
      { status: 500 }
    );
  }
}
