// ─── Search Lenses ───
export type SearchLens = "web" | "pdf" | "government" | "procurement" | "pricing" | "technical" | "news";

export type SearchSource = "google" | "bing" | "duckduckgo" | "brave" | "wikipedia" | "github" | "stackoverflow" | "news" | "scholar" | "semantic";

// ─── Legacy generic search result (kept for backward compat) ───
export interface SearchResult {
  id: string;
  title: string;
  url: string;
  description: string;
  source: SearchSource;
  rank: number;
  score: number;
  timestamp: string;
  favicon?: string;
  domain: string;
  content?: string;
}

export interface Signal {
  name: string;
  score: number;
  description: string;
}

export interface IntelligenceObject {
  query: string;
  lens: SearchLens;
  summary?: string;
  confidence: number;
  signals: Signal[];
  sources: string[];
  queryExpansions: string[];
  timestamp: string;
  note?: string;
}

export interface ScrapedResult {
  title: string;
  url: string;
  description: string;
  domain: string;
  source: string;
  rank: number;
  score: number;
  resultType?: "web" | "pdf" | "government" | "procurement" | "pricing" | "technical" | "news";
}

export interface SearchFilters {
  sources: SearchSource[];
  timeRange: "any" | "day" | "week" | "month" | "year";
  contentType: "all" | "news" | "images" | "videos" | "academic" | "code" | "social";
  safeSearch: boolean;
  exactMatch: boolean;
  requireImages: boolean;
}

export interface AIInsight {
  summary: string;
  keyPoints: string[];
  relatedTopics: string[];
  confidence: number;
  sources: string[];
}

export interface SearchHistoryItem {
  id: string;
  query: string;
  timestamp: string;
  filters: SearchFilters;
  resultCount: number;
  starred: boolean;
}

export interface BookmarkItem {
  id: string;
  title: string;
  url: string;
  description: string;
  tags: string[];
  createdAt: string;
  folder: string;
}

export interface SearchSuggestion {
  text: string;
  type: "trending" | "related" | "history" | "ai";
  score: number;
}

export type ViewMode = "grid" | "list" | "compact" | "cards";

export type ThemeMode = "light" | "dark" | "system" | "oled" | "sepia";

export interface UserSettings {
  theme: ThemeMode;
  defaultSources: SearchSource[];
  resultsPerPage: number;
  autoSummarize: boolean;
  safeSearch: boolean;
  openInNewTab: boolean;
  showFavicons: boolean;
  showDescriptions: boolean;
  keyboardShortcuts: boolean;
  searchDelay: number;
  preferredLanguage: string;
  region: string;
  aiModel: string;
}
