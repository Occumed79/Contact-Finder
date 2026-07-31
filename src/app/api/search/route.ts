import { NextRequest, NextResponse } from "next/server";
import { multiDimensionSearch } from "../../../lib/scrapers/orchestrator";
import {
  expandQuery,
  buildIntelligenceObject,
  type Vertical,
} from "../../../lib/intelligence";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, vertical } = body as { query: string; vertical?: Vertical };

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    // Default to contact vertical — this app is a LinkedIn + email finder
    const targetVertical: Vertical = vertical || "contact";

    try {
      const multiResult = await multiDimensionSearch(query, targetVertical);

      if (multiResult.contacts.length > 0) {
        const expanded = expandQuery(query, targetVertical);
        const intelligenceObject = buildIntelligenceObject(
          query,
          expanded,
          multiResult.contacts,
          multiResult.sources,
          multiResult.rawTexts,
          undefined
        );

        return NextResponse.json({
          ...intelligenceObject,
          methodBreakdown: multiResult.methodBreakdown,
          totalMethodsAttempted: multiResult.totalMethodsAttempted,
          successfulMethods: multiResult.successfulMethods,
        });
      }

      // Real search ran but found nothing — return empty results with a clear note.
      // Do NOT invent fake contacts.
      console.warn("Multi-dimensional search found no contacts");
      const expanded = expandQuery(query, targetVertical);
      return NextResponse.json({
        organization: query,
        vertical: targetVertical,
        confidence: 0,
        contacts: [],
        signals: [],
        sources: multiResult.sources,
        queryExpansions: expanded.expansions,
        timestamp: new Date().toISOString(),
        note: "No LinkedIn profiles or emails found for this organization. Try a more specific company name, full legal name, or check spelling.",
        methodBreakdown: multiResult.methodBreakdown,
        totalMethodsAttempted: multiResult.totalMethodsAttempted,
        successfulMethods: multiResult.successfulMethods,
      });
    } catch (err) {
      console.error("Multi-dimensional search failed:", err);
      const expanded = expandQuery(query, targetVertical);
      return NextResponse.json({
        organization: query,
        vertical: targetVertical,
        confidence: 0,
        contacts: [],
        signals: [],
        sources: [],
        queryExpansions: expanded.expansions,
        timestamp: new Date().toISOString(),
        note: "Search methods failed (network or scraper limits). No contact data available. Try again later or use a different organization name.",
      });
    }
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
