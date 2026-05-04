import { NextRequest, NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { emailUploadsTable } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";

async function getUserId(req: NextRequest): Promise<string | null> {
  const authHeader = req.headers.get("Authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return null;
  try {
    const client = await clerkClient();
    const payload = await client.verifyToken(token);
    return payload.sub;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  try {
    const userId = await getUserId(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const uploads = await db
      .select()
      .from(emailUploadsTable)
      .where(eq(emailUploadsTable.userId, userId))
      .orderBy(desc(emailUploadsTable.createdAt))
      .limit(50);

    return NextResponse.json(uploads);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserId(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json() as {
      fileName: string;
      totalEmails: number;
      validCount: number;
      invalidCount: number;
    };

    const { fileName, totalEmails, validCount, invalidCount } = body;

    if (!fileName || totalEmails == null || validCount == null || invalidCount == null) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const [record] = await db
      .insert(emailUploadsTable)
      .values({ userId, fileName, totalEmails, validCount, invalidCount })
      .returning();

    return NextResponse.json(record, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
