import { SearchResult, AIInsight, SearchSource } from "@/types/search";
import * as cheerio from "cheerio";

const DDG_BASE = "https://html.duckduckgo.com/html/?q=";

const SOURCE_MAP: Record<string, SearchSource> = {
  "wikipedia.org": "wikipedia",
  "github.com": "github",
  "stackoverflow.com": "stackoverflow",
  "news.google.com": "news",
  "scholar.google.com": "scholar",
};

function detectSource(url: string): SearchSource {
  try {
    const domain = new URL(url).hostname.replace("www.", "");
    for (const [key, value] of Object.entries(SOURCE_MAP)) {
      if (domain.includes(key)) return value;
    }
    return "duckduckgo";
  } catch {
    return "duckduckgo";
  }
}

async function fetchWithTimeout(url: string, options: RequestInit, timeout = 8000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return res;
  } catch (e) {
    clearTimeout(id);
    throw e;
  }
}

export async function scrapeDuckDuckGo(query: string, page = 1): Promise<SearchResult[]> {
  const offset = (page - 1) * 30;
  const url = `${DDG_BASE}${encodeURIComponent(query)}${offset > 0 ? `&s=${offset}` : ""}`;

  const response = await fetchWithTimeout(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
    },
  });

  if (!response.ok) {
    throw new Error(`DuckDuckGo returned ${response.status}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);
  const results: SearchResult[] = [];

  $(".result").each((i, el) => {
    const titleEl = $(el).find(".result__a");
    const title = titleEl.text().trim();
    const href = titleEl.attr("href");
    const snippet = $(el).find(".result__snippet").text().trim();

    if (!title || !href) return;

    let realUrl = href;
    try {
      const urlObj = new URL(href);
      if (urlObj.hostname === "duckduckgo.com" && urlObj.searchParams.has("uddg")) {
        realUrl = decodeURIComponent(urlObj.searchParams.get("uddg")!);
      }
    } catch { /* keep original */ }

    const domain = (() => {
      try { return new URL(realUrl).hostname.replace("www.", ""); }
      catch { return "unknown"; }
    })();

    results.push({
      id: `ddg-${offset + i}-${Date.now()}`,
      title,
      url: realUrl,
      description: snippet || `Result for ${query} from ${domain}`,
      source: detectSource(realUrl),
      rank: offset + i + 1,
      score: Math.max(0.95 - (offset + i) * 0.03, 0.1),
      timestamp: new Date().toISOString(),
      favicon: `https://www.google.com/s2/favicons?domain=${domain}&sz=32`,
      domain,
    });
  });

  return results;
}

export function generateMockResults(query: string) {
  const templates = [
    `Complete Guide to ${query}`,
    `${query}: Everything You Need to Know`,
    `Top Resources for ${query}`,
    `Understanding ${query} - Deep Dive`,
    `${query} Best Practices and Tips`,
    `Latest ${query} Updates`,
    `How to Master ${query}`,
    `${query} vs Alternatives: Comparison`,
  ];

  const sources: SearchSource[] = ["google", "bing", "duckduckgo", "wikipedia", "github", "stackoverflow"];
  const results: SearchResult[] = [];

  sources.forEach((source, sIdx) => {
    for (let i = 0; i < 3; i++) {
      const idx = sIdx * 3 + i;
      results.push({
        id: `${source}-${idx}-${Date.now()}`,
        title: templates[idx % templates.length],
        url: `https://${source === "duckduckgo" ? "duckduckgo.com" : source + ".com"}/search?q=${encodeURIComponent(query)}`,
        description: `Comprehensive overview of ${query} covering fundamentals, advanced techniques, and real-world applications.`,
        source,
        rank: idx + 1,
        score: Math.max(0.1, 1 - idx * 0.05),
        timestamp: new Date(Date.now() - Math.random() * 86400000 * 30).toISOString(),
        favicon: `https://www.google.com/s2/favicons?domain=${source}.com&sz=32`,
        domain: `${source}.com`,
      });
    }
  });

  return {
    results: results.sort((a, b) => b.score - a.score),
    totalResults: results.length * 3,
    hasMore: false,
    page: 1,
    aiInsight: generateAIInsight(query, results),
  };
}

export function generateAIInsight(query: string, results: SearchResult[]): AIInsight {
  const topics = query.split(/\s+/).filter(w => w.length > 2);
  const domains = [...new Set(results.map(r => r.domain))];
  return {
    summary: `Search for "${query}" returned ${results.length} results from ${domains.length} unique sources.`,
    keyPoints: results.slice(0, 5).map((r, i) => `${i + 1}. ${r.title} — ${r.domain}`),
    relatedTopics: [
      ...topics.map(t => `${t} tutorial`),
      `${query} documentation`,
      `${query} examples`,
    ],
    confidence: Math.min(0.7 + (results.length * 0.02), 0.95),
    sources: domains.slice(0, 4),
  };
}
