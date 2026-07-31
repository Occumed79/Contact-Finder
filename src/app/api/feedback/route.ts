import { NextRequest, NextResponse } from "next/server";
import { addServerFeedback, getServerFeedback } from "../../../lib/learning";
import type { FeedbackEntry } from "../../../types/search";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { value, type, organization, verdict } = body as FeedbackEntry;

    if (!value || !type || !organization || !verdict) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }
    if (verdict !== "good" && verdict !== "bad") {
      return NextResponse.json({ error: "verdict must be good or bad" }, { status: 400 });
    }

    const entry: FeedbackEntry = {
      value,
      type,
      organization,
      verdict,
      timestamp: new Date().toISOString(),
    };

    addServerFeedback(entry);

    return NextResponse.json({ ok: true, entry });
  } catch (error) {
    console.error("Feedback error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    count: getServerFeedback().length,
    entries: getServerFeedback().slice(-50),
  });
}
