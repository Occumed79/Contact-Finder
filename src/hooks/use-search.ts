"use client";

import { useState, useCallback } from "react";
import { type IntelligenceObject, type Vertical, type SearchSuggestion } from "@/types/search";

interface UseSearchReturn {
  query: string;
  setQuery: (q: string) => void;
  vertical: Vertical;
  setVertical: (v: Vertical) => void;
  intelligence: IntelligenceObject | null;
  isLoading: boolean;
  error: string | null;
  suggestions: SearchSuggestion[];
  hasSearched: boolean;
  searchTime: number;
  performSearch: () => Promise<void>;
}

export function useSearch(): UseSearchReturn {
  const [query, setQuery] = useState("");
  const [vertical, setVertical] = useState<Vertical>("general");
  const [intelligence, setIntelligence] = useState<IntelligenceObject | null>(null);
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
        body: JSON.stringify({ query, vertical }),
      });

      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`);
      }

      const data = (await response.json()) as IntelligenceObject;
      setIntelligence(data);
      setHasSearched(true);
      setSearchTime(performance.now() - startTime);

      // Mock suggestions based on query expansions
      if (data.queryExpansions?.length) {
        setSuggestions(
          data.queryExpansions.map((text, i) => ({
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
  }, [query, vertical]);

  return {
    query,
    setQuery,
    vertical,
    setVertical,
    intelligence,
    isLoading,
    error,
    suggestions,
    hasSearched,
    searchTime,
    performSearch,
  };
}
