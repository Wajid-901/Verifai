import { NextRequest, NextResponse } from "next/server";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateEmail(email: string): boolean {
  return EMAIL_REGEX.test(email.trim());
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.emails || !Array.isArray(body.emails)) {
      return NextResponse.json(
        { error: "Invalid request: expected { emails: string[] }" },
        { status: 400 }
      );
    }

    const emails: string[] = body.emails;
    const valid: string[] = [];
    const invalid: string[] = [];

    for (const email of emails) {
      const trimmed = email.trim();
      if (!trimmed) continue;
      if (validateEmail(trimmed)) {
        valid.push(trimmed);
      } else {
        invalid.push(trimmed);
      }
    }

    return NextResponse.json({
      valid,
      invalid,
      total: valid.length + invalid.length,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
