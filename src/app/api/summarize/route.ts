import { NextRequest, NextResponse } from "next/server";
import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";

export const runtime = "edge";

export async function POST(request: NextRequest) {
  try {
    const { query, results } = await request.json();

    if (!query) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    const result = streamText({
      model: openai("gpt-4o-mini"),
      system: "You are an expert research assistant. Provide concise, accurate summaries of search results. Focus on key findings, actionable insights, and credible information. Use bullet points for clarity.",
      prompt: `Summarize the following search results for the query "${query}":

${results?.map((r: { title: string; description: string }) => `- ${r.title}: ${r.description}`).join("\n") || "No results provided"}

Provide:
1. A brief overall summary (2-3 sentences)
2. Key findings as bullet points
3. Most reliable sources
4. Related topics to explore`,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error("Summarize error:", error);
    return NextResponse.json(
      { error: "Failed to generate summary" },
      { status: 500 }
    );
  }
}
