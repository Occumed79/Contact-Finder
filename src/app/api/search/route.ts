import { NextRequest, NextResponse } from "next/server";
import { scrapeDuckDuckGo, generateMockResults } from "@/lib/search-engines";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, page = 1 } = body as { query: string; page?: number };

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    try {
      // Try real DuckDuckGo scraping (no API keys needed)
      const results = await scrapeDuckDuckGo(query, page);
      if (results.length > 0) {
        return NextResponse.json({
          results,
          totalResults: results.length * 3,
          hasMore: results.length >= 20,
          aiInsight: {
            summary: `DuckDuckGo search for "${query}" returned ${results.length} live results.`,
            keyPoints: results.slice(0, 5).map((r, i) => `${i + 1}. ${r.title}`),
            relatedTopics: [`${query} tutorial`, `${query} documentation`, `${query} examples`],
            confidence: 0.85,
            sources: [...new Set(results.map(r => r.domain))].slice(0, 4),
          },
          page,
          note: "Live data scraped from DuckDuckGo.",
        });
      }
    } catch (err) {
      console.warn("Scraping failed, falling back to mock:", err);
    }

    // Fallback to algorithmic mock data
    const mock = generateMockResults(query);
    return NextResponse.json({
      ...mock,
      note: "Search engines unavailable. Showing generated data.",
    });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
