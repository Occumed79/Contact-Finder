"use client";

import { useState, useCallback, useEffect } from "react";
import { SearchResult, SearchFilters, AIInsight, SearchSuggestion, SearchSource } from "@/types/search";

interface UseSearchReturn {
  query: string;
  setQuery: (q: string) => void;
  results: SearchResult[];
  isLoading: boolean;
  error: string | null;
  filters: SearchFilters;
  setFilters: (f: SearchFilters) => void;
  aiInsight: AIInsight | null;
  suggestions: SearchSuggestion[];
  hasSearched: boolean;
  totalResults: number;
  searchTime: number;
  performSearch: () => Promise<void>;
  loadMore: () => Promise<void>;
  page: number;
  hasMore: boolean;
}

const defaultFilters: SearchFilters = {
  sources: ["google", "bing", "duckduckgo", "brave", "wikipedia", "github", "stackoverflow", "news"],
  timeRange: "any",
  contentType: "all",
  safeSearch: true,
  exactMatch: false,
  requireImages: false,
};

export function useSearch(): UseSearchReturn {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<SearchFilters>(defaultFilters);
  const [aiInsight, setAiInsight] = useState<AIInsight | null>(null);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  const [searchTime, setSearchTime] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const performSearch = useCallback(async () => {
    if (!query.trim()) return;

    setIsLoading(true);
    setError(null);
    setPage(1);
    const startTime = performance.now();

    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, filters, page: 1 }),
      });

      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`);
      }

      const data = await response.json();
      setResults(data.results);
      setTotalResults(data.totalResults);
      setHasMore(data.hasMore);
      setAiInsight(data.aiInsight);
      setHasSearched(true);
      setSearchTime(performance.now() - startTime);

      // Fetch suggestions
      const suggResponse = await fetch("/api/suggestions?q=" + encodeURIComponent(query));
      if (suggResponse.ok) {
        const suggData = await suggResponse.json();
        setSuggestions(suggData.suggestions);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setIsLoading(false);
    }
  }, [query, filters]);

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoading) return;

    setIsLoading(true);
    const nextPage = page + 1;

    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, filters, page: nextPage }),
      });

      if (!response.ok) {
        throw new Error("Failed to load more results");
      }

      const data = await response.json();
      setResults((prev) => [...prev, ...data.results]);
      setHasMore(data.hasMore);
      setPage(nextPage);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load more");
    } finally {
      setIsLoading(false);
    }
  }, [query, filters, page, hasMore, isLoading]);

  return {
    query,
    setQuery,
    results,
    isLoading,
    error,
    filters,
    setFilters,
    aiInsight,
    suggestions,
    hasSearched,
    totalResults,
    searchTime,
    performSearch,
    loadMore,
    page,
    hasMore,
  };
}
