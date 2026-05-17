import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [subResult, profileResult] = await Promise.all([
      supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase
        .from("profiles")
        .select("plan, stripe_customer_id")
        .eq("id", user.id)
        .single(),
    ]);

    const plan = (profileResult.data?.plan as string | null) ?? "free";

    // Usage: validations today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const [todayResult, monthResult] = await Promise.all([
      supabase
        .from("uploads")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("created_at", todayStart.toISOString()),
      supabase
        .from("uploads")
        .select("total_emails")
        .eq("user_id", user.id)
        .gte("created_at", monthStart.toISOString()),
    ]);

    const monthEmails = (monthResult.data ?? []).reduce(
      (sum, u) => sum + ((u.total_emails as number) ?? 0),
      0
    );

    return NextResponse.json({
      subscription:    subResult.data ?? null,
      plan,
      hasStripeCustomer: !!(profileResult.data?.stripe_customer_id),
      usage: {
        todayValidations: todayResult.count ?? 0,
        monthEmails,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch subscription" },
      { status: 500 }
    );
  }
}
