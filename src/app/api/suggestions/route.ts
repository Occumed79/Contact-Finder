import { NextRequest, NextResponse } from "next/server";
import { SearchSuggestion } from "../../../types/search";

function generateSuggestions(query: string): SearchSuggestion[] {
  const words = query.split(/\s+/).filter(w => w.length > 2);
  const suggestions: SearchSuggestion[] = [
    {
      text: `${query} tutorial`,
      type: "related",
      score: 0.95,
    },
    {
      text: `${query} best practices`,
      type: "related",
      score: 0.92,
    },
    {
      text: `${query} documentation`,
      type: "related",
      score: 0.90,
    },
    {
      text: `${query} examples`,
      type: "related",
      score: 0.88,
    },
    {
      text: `what is ${query}`,
      type: "trending",
      score: 0.85,
    },
    {
      text: `${query} vs alternatives`,
      type: "trending",
      score: 0.82,
    },
    {
      text: `how to use ${query}`,
      type: "related",
      score: 0.80,
    },
    {
      text: `${query} getting started`,
      type: "trending",
      score: 0.78,
    },
    ...words.map((word, i) => ({
      text: `${word} guide`,
      type: "related" as const,
      score: 0.75 - i * 0.02,
    })),
  ];

  return suggestions.slice(0, 10);
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  if (!query || query.trim().length === 0) {
    return NextResponse.json({ suggestions: [] });
  }

  const suggestions = generateSuggestions(query);

  return NextResponse.json({ suggestions });
}
