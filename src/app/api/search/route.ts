import { NextRequest, NextResponse } from "next/server";
import { multiDimensionSearch } from "../../../lib/scrapers/orchestrator";
import { buildIntelligenceObject, expandQuery } from "../../../lib/intelligence";
import { applyLearningFilter } from "../../../lib/learning";
import { getFeedbackEntriesForOrganization } from "../../../lib/neon-feedback";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query } = body as { query: string };

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    const organization = query.trim();

    try {
      const multiResult = await multiDimensionSearch(organization);
      let learnedContacts = multiResult.contacts;
      let learnedFeedbackCount = 0;

      if (learnedContacts.length > 0) {
        try {
          // Pull the persisted good/bad learning for this organization from Neon before scoring.
          // This is the retention layer: browser localStorage is not used for learning memory.
          const feedbackEntries = await getFeedbackEntriesForOrganization(organization, 10_000);
          learnedFeedbackCount = feedbackEntries.length;
          learnedContacts = applyLearningFilter(learnedContacts, organization, feedbackEntries);
        } catch (learningError) {
          console.warn("Learning feedback unavailable; returning unfiltered contacts:", learningError);
        }
      }

      if (learnedContacts.length > 0) {
        const intelligenceObject = buildIntelligenceObject(
          organization,
          learnedContacts,
          multiResult.sources,
          multiResult.rawTexts
        );

        return NextResponse.json({
          ...intelligenceObject,
          learning: {
            persisted: true,
            feedbackCount: learnedFeedbackCount,
            source: "neon",
          },
          methodBreakdown: multiResult.methodBreakdown,
          totalMethodsAttempted: multiResult.totalMethodsAttempted,
          successfulMethods: multiResult.successfulMethods,
        });
      }

      const expanded = expandQuery(organization);
      return NextResponse.json({
        organization,
        confidence: 0,
        contacts: [],
        signals: [],
        sources: multiResult.sources,
        queryExpansions: expanded.expansions,
        timestamp: new Date().toISOString(),
        learning: {
          persisted: true,
          feedbackCount: learnedFeedbackCount,
          source: "neon",
        },
        note: "No emails, LinkedIn profiles, or employees found after learning filters. Try a more specific company name or full legal name.",
        methodBreakdown: multiResult.methodBreakdown,
        totalMethodsAttempted: multiResult.totalMethodsAttempted,
        successfulMethods: multiResult.successfulMethods,
      });
    } catch (err) {
      console.error("Search failed:", err);
      const expanded = expandQuery(organization);
      return NextResponse.json({
        organization,
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
