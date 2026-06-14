import { NextRequest, NextResponse } from "next/server";
import { multiDimensionSearch } from "../../../lib/scrapers/orchestrator";
import { generateMockIntelligence, expandQuery, scoreSignals, calculateConfidence, buildIntelligenceObject, type Vertical } from "../../../lib/intelligence";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, vertical } = body as { query: string; vertical?: Vertical };

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    const targetVertical = vertical || 'contact';

    try {
      // Run multi-dimensional search
      const multiResult = await multiDimensionSearch(query, targetVertical);

      // If we got real contacts, build intelligence object
      if (multiResult.contacts.length > 0) {
        const expanded = expandQuery(query, targetVertical);
        const allText = multiResult.rawTexts.join(' ');
        const signals = scoreSignals(allText);

        const intelligenceObject = buildIntelligenceObject(
          query,
          expanded,
          multiResult.contacts,
          multiResult.sources,
          multiResult.rawTexts,
          undefined
        );

        // Add method breakdown to response for transparency
        return NextResponse.json({
          ...intelligenceObject,
          methodBreakdown: multiResult.methodBreakdown,
          totalMethodsAttempted: multiResult.totalMethodsAttempted,
          successfulMethods: multiResult.successfulMethods,
        });
      }

      // If no contacts found, fall back to mock intelligence
      console.warn("Multi-dimensional search found no contacts, falling back to mock");
      const mockResult = generateMockIntelligence(query, targetVertical);
      return NextResponse.json({
        ...mockResult,
        methodBreakdown: multiResult.methodBreakdown,
        totalMethodsAttempted: multiResult.totalMethodsAttempted,
        successfulMethods: multiResult.successfulMethods,
        note: "No real contacts found. Showing demonstration data.",
      });
    } catch (err) {
      console.error("Multi-dimensional search failed:", err);
      // Final fallback to mock
      const mockResult = generateMockIntelligence(query, targetVertical);
      return NextResponse.json({
        ...mockResult,
        note: "All search methods failed. Showing demonstration data.",
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
