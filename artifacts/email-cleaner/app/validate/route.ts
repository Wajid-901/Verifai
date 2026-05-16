import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { validateEmails } from "@/lib/validation";

const FREE_LIMIT = 100;
const PRO_LIMIT = 100_000;
const MAX_BODY_SIZE = 5 * 1024 * 1024;

export async function POST(req: NextRequest) {
  try {
    const contentLength = req.headers.get("content-length");
    if (contentLength && parseInt(contentLength) > MAX_BODY_SIZE) {
      return NextResponse.json(
        { error: "Request too large. Maximum 5MB." },
        { status: 413 }
      );
    }

    const body = await req.json();

    if (!body.emails || !Array.isArray(body.emails)) {
      return NextResponse.json(
        { error: "Invalid request: expected { emails: string[] }" },
        { status: 400 }
      );
    }

    const emails: string[] = body.emails;

    // Determine user plan for server-side limit enforcement
    let plan: "free" | "pro" = "free";
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("plan")
          .eq("id", user.id)
          .single();
        if (profile?.plan === "pro") plan = "pro";
      }
    } catch {
      // Unauthenticated request — free limit applies
    }

    const limit = plan === "pro" ? PRO_LIMIT : FREE_LIMIT;

    if (emails.length > limit) {
      return NextResponse.json(
        {
          error:
            plan === "free"
              ? `Free plan is limited to ${FREE_LIMIT} emails per request. Upgrade to Pro for unlimited.`
              : `Request exceeds the maximum of ${PRO_LIMIT} emails per request.`,
        },
        { status: 422 }
      );
    }

    const result = validateEmails(emails, {
      removeDuplicates: true,
      flagRisky: plan === "pro",
    });

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
