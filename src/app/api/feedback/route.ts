import { NextRequest, NextResponse } from "next/server";
import { getFeedbackEntries, isNeonConfigured, saveFeedbackEntry } from "../../../lib/neon-feedback";
import type { FeedbackEntry } from "../../../types/search";

export async function POST(request: NextRequest) {
  try {
    if (!isNeonConfigured()) {
      return NextResponse.json(
        { error: "DATABASE_URL is not configured" },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { value, type, organization, verdict } = body as FeedbackEntry;

    if (!value || !type || !organization || !verdict) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }
    if (verdict !== "good" && verdict !== "bad") {
      return NextResponse.json({ error: "verdict must be good or bad" }, { status: 400 });
    }
    if (type !== "email" && type !== "linkedin" && type !== "employee") {
      return NextResponse.json({ error: "type must be email, linkedin, or employee" }, { status: 400 });
    }

    const entry = await saveFeedbackEntry({
      value,
      type,
      organization,
      verdict,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true, persisted: true, entry });
  } catch (error) {
    console.error("Feedback error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const entries = await getFeedbackEntries(50);

    return NextResponse.json({
      configured: isNeonConfigured(),
      count: entries.length,
      entries,
    });
  } catch (error) {
    console.error("Feedback read error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
