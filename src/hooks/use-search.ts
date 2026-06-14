"use client";

import { useState, useCallback } from "react";
import { type IntelligenceObject, type ScrapedResult, type SearchLens, type SearchSuggestion } from "@/types/search";

interface UseSearchReturn {
  query: string;
  setQuery: (q: string) => void;
  lens: SearchLens;
  setLens: (l: SearchLens) => void;
  intelligence: IntelligenceObject | null;
  scrapedResults: ScrapedResult[];
  isLoading: boolean;
  error: string | null;
  suggestions: SearchSuggestion[];
  hasSearched: boolean;
  searchTime: number;
  performSearch: () => Promise<void>;
}

export function useSearch(): UseSearchReturn {
  const [query, setQuery] = useState("");
  const [lens, setLens] = useState<SearchLens>("web");
  const [intelligence, setIntelligence] = useState<IntelligenceObject | null>(null);
  const [scrapedResults, setScrapedResults] = useState<ScrapedResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchTime, setSearchTime] = useState(0);

  const performSearch = useCallback(async () => {
    if (!query.trim()) return;

    setIsLoading(true);
    setError(null);
    const startTime = performance.now();

    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, lens }),
      });

      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`);
      }

      const data = (await response.json()) as {
        query: string;
        lens: SearchLens;
        summary?: string;
        expandedQueries: string[];
        signals: Array<{ name: string; score: number; description: string }>;
        results: ScrapedResult[];
        sources: string[];
        timestamp: string;
        confidence: number;
      };
      
      setIntelligence({
        query: data.query,
        lens: data.lens,
        summary: data.summary,
        confidence: data.confidence,
        signals: data.signals,
        sources: data.sources,
        queryExpansions: data.expandedQueries,
        timestamp: data.timestamp,
      });
      setScrapedResults(data.results || []);
      setHasSearched(true);
      setSearchTime(performance.now() - startTime);

      if (data.expandedQueries?.length) {
        setSuggestions(
          data.expandedQueries.map((text, i) => ({
            text,
            type: i === 0 ? ("related" as const) : ("ai" as const),
            score: 1 - i * 0.1,
          }))
        );
      } else {
        setSuggestions([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setIsLoading(false);
    }
  }, [query, lens]);

  return {
    query,
    setQuery,
    lens,
    setLens,
    intelligence,
    scrapedResults,
    isLoading,
    error,
    suggestions,
    hasSearched,
    searchTime,
    performSearch,
  };
}
