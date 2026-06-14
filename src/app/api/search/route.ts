import { NextRequest, NextResponse } from "next/server";
import { SearchResult, SearchFilters, AIInsight, SearchSource } from "@/types/search";

// Simulated search sources with realistic mock data
const MOCK_SOURCES: Record<SearchSource, string[]> = {
  google: [
    "https://www.google.com/search?q=",
    "Official documentation and guides",
    "Community forums and discussions",
    "News articles and press releases",
  ],
  bing: [
    "https://www.bing.com/search?q=",
    "Academic papers and research",
    "Technical blogs and tutorials",
  ],
  duckduckgo: [
    "https://duckduckgo.com/?q=",
    "Privacy-focused resources",
    "Alternative viewpoints",
  ],
  brave: [
    "https://search.brave.com/search?q=",
    "Curated high-quality results",
  ],
  wikipedia: [
    "https://en.wikipedia.org/wiki/",
    "Comprehensive encyclopedia entries",
    "Historical context and references",
  ],
  github: [
    "https://github.com/search?q=",
    "Open source repositories",
    "Code examples and implementations",
  ],
  stackoverflow: [
    "https://stackoverflow.com/search?q=",
    "Developer Q&A solutions",
    "Technical troubleshooting",
  ],
  news: [
    "https://news.google.com/search?q=",
    "Latest developments and updates",
    "Breaking news coverage",
  ],
  scholar: [
    "https://scholar.google.com/scholar?q=",
    "Peer-reviewed research papers",
    "Academic citations and references",
  ],
  semantic: [
    "AI-curated semantic search",
    "Conceptually related content",
  ],
};

const DOMAIN_MAP: Record<SearchSource, string> = {
  google: "google.com",
  bing: "bing.com",
  duckduckgo: "duckduckgo.com",
  brave: "brave.com",
  wikipedia: "wikipedia.org",
  github: "github.com",
  stackoverflow: "stackoverflow.com",
  news: "news.google.com",
  scholar: "scholar.google.com",
  semantic: "semantic.ai",
};

function generateMockResults(query: string, filters: SearchFilters, page: number): SearchResult[] {
  const results: SearchResult[] = [];
  const sources = filters.sources.length > 0 ? filters.sources : ["google", "bing", "duckduckgo"] as SearchSource[];
  const resultsPerSource = 3;

  sources.forEach((source, sourceIdx) => {
    for (let i = 0; i < resultsPerSource; i++) {
      const idx = (page - 1) * resultsPerSource * sources.length + sourceIdx * resultsPerSource + i;
      const score = Math.max(0.1, 1 - idx * 0.05 + Math.random() * 0.1);
      
      results.push({
        id: `${source}-${idx}-${Date.now()}`,
        title: generateTitle(query, source, idx),
        url: `https://${DOMAIN_MAP[source]}/result/${encodeURIComponent(query.replace(/\s+/g, "-"))}-${idx}`,
        description: generateDescription(query, source, idx),
        source,
        rank: idx + 1,
        score,
        timestamp: new Date(Date.now() - Math.random() * 86400000 * 30).toISOString(),
        favicon: `https://${DOMAIN_MAP[source]}/favicon.ico`,
        domain: DOMAIN_MAP[source],
        content: generateContent(query, source, idx),
      });
    }
  });

  // Sort by score descending
  return results.sort((a, b) => b.score - a.score);
}

function generateTitle(query: string, source: SearchSource, idx: number): string {
  const templates = [
    `Complete Guide to ${query} - ${source.charAt(0).toUpperCase() + source.slice(1)}`,
    `${query}: Everything You Need to Know (${source})`,
    `Top ${idx + 1} Resources for ${query}`,
    `Understanding ${query} - Deep Dive`,
    `${query} Best Practices and Tips`,
    `Latest ${query} Updates and News`,
    `How to Master ${query} - Tutorial`,
    `${query} vs Alternatives: Comparison`,
  ];
  return templates[idx % templates.length];
}

function generateDescription(query: string, source: SearchSource, idx: number): string {
  const descriptions = [
    `Comprehensive overview of ${query} covering fundamentals, advanced techniques, and real-world applications. Updated regularly with the latest information from ${source}.`,
    `Explore ${query} in depth with expert insights, practical examples, and step-by-step guides. Perfect for beginners and professionals alike.`,
    `Discover the best strategies for ${query}. This resource covers everything from basic concepts to advanced implementation details.`,
    `A curated collection of ${query} resources, tutorials, and community discussions. Find answers to your most pressing questions.`,
    `Learn ${query} with hands-on tutorials, code examples, and detailed explanations. Start from scratch or advance your existing skills.`,
    `Stay updated with the latest ${query} trends, news, and developments. Analysis from industry experts and thought leaders.`,
  ];
  return descriptions[idx % descriptions.length];
}

function generateContent(query: string, source: SearchSource, idx: number): string {
  return `${query} is a topic of growing importance in today's digital landscape. This article from ${source} provides detailed insights into its key aspects, implementation strategies, and best practices. Whether you're just getting started or looking to optimize your existing approach, this resource offers valuable guidance for all skill levels. The content has been verified by subject matter experts and includes references to official documentation and community resources.`;
}

function generateAIInsight(query: string): AIInsight {
  const topics = query.split(/\s+/);
  return {
    summary: `Based on comprehensive analysis of multiple search sources, ${query} represents a significant area of interest with applications spanning technology, business, and research domains. Key findings indicate rapid growth and evolving best practices in this field.`,
    keyPoints: [
      `${query} has seen significant adoption across industries in recent years`,
      `Multiple implementation approaches exist depending on use case requirements`,
      `Integration with existing systems requires careful architectural planning`,
      `Community resources and documentation continue to expand rapidly`,
      `Performance optimization is a key consideration for production deployments`,
    ],
    relatedTopics: [
      ...topics.map(t => `${t} best practices`),
      `${query} tutorial`,
      `${query} alternatives`,
      `${query} performance`,
    ],
    confidence: 0.89,
    sources: ["google.com", "wikipedia.org", "github.com", "stackoverflow.com"],
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, filters, page = 1 } = body as { query: string; filters: SearchFilters; page?: number };

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    const results = generateMockResults(query, filters, page);
    const aiInsight = generateAIInsight(query);
    const totalResults = results.length * 3; // Simulate more results
    const hasMore = page < 5;

    return NextResponse.json({
      results,
      totalResults,
      hasMore,
      aiInsight,
      page,
    });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
