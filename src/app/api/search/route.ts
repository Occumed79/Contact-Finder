import { NextRequest, NextResponse } from "next/server";
import { multiDimensionSearch } from "../../../lib/scrapers/orchestrator";
import { buildIntelligenceObject, expandQuery } from "../../../lib/intelligence";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query } = body as { query: string };

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    try {
      const multiResult = await multiDimensionSearch(query.trim());

      if (multiResult.contacts.length > 0) {
        const intelligenceObject = buildIntelligenceObject(
          query.trim(),
          multiResult.contacts,
          multiResult.sources,
          multiResult.rawTexts
        );

        return NextResponse.json({
          ...intelligenceObject,
          methodBreakdown: multiResult.methodBreakdown,
          totalMethodsAttempted: multiResult.totalMethodsAttempted,
          successfulMethods: multiResult.successfulMethods,
        });
      }

      const expanded = expandQuery(query.trim());
      return NextResponse.json({
        organization: query.trim(),
        confidence: 0,
        contacts: [],
        signals: [],
        sources: multiResult.sources,
        queryExpansions: expanded.expansions,
        timestamp: new Date().toISOString(),
        note: "No emails, LinkedIn profiles, or employees found. Try a more specific company name or full legal name.",
        methodBreakdown: multiResult.methodBreakdown,
        totalMethodsAttempted: multiResult.totalMethodsAttempted,
        successfulMethods: multiResult.successfulMethods,
      });
    } catch (err) {
      console.error("Search failed:", err);
      const expanded = expandQuery(query.trim());
      return NextResponse.json({
        organization: query.trim(),
        confidence: 0,
        contacts: [],
        signals: [],
        sources: [],
        queryExpansions: expanded.expansions,
        timestamp: new Date().toISOString(),
        note: "Search methods failed (network or rate limits). Try again shortly.",
      });
    }
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
