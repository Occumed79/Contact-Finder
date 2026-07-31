"use client";

import { useState, useCallback } from "react";
import type { IntelligenceObject, SearchSuggestion, ContactType, FeedbackEntry } from "../types/search";
import { recordClientFeedback } from "../lib/learning";

interface UseSearchReturn {
  query: string;
  setQuery: (q: string) => void;
  activeLens: ContactType | "all";
  setActiveLens: (l: ContactType | "all") => void;
  intelligence: IntelligenceObject | null;
  isLoading: boolean;
  error: string | null;
  suggestions: SearchSuggestion[];
  hasSearched: boolean;
  searchTime: number;
  performSearch: () => Promise<void>;
  sendFeedback: (value: string, type: ContactType, verdict: "good" | "bad") => Promise<void>;
  feedbackMap: Record<string, "good" | "bad">;
}

export function useSearch(): UseSearchReturn {
  const [query, setQuery] = useState("");
  const [activeLens, setActiveLens] = useState<ContactType | "all">("all");
  const [intelligence, setIntelligence] = useState<IntelligenceObject | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchTime, setSearchTime] = useState(0);
  const [feedbackMap, setFeedbackMap] = useState<Record<string, "good" | "bad">>({});

  const performSearch = useCallback(async () => {
    if (!query.trim()) return;

    setIsLoading(true);
    setError(null);
    const startTime = performance.now();

    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`);
      }

      const data = (await response.json()) as IntelligenceObject;
      setIntelligence(data);
      setHasSearched(true);
      setSearchTime(performance.now() - startTime);

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
  }, [query]);

  const sendFeedback = useCallback(
    async (value: string, type: ContactType, verdict: "good" | "bad") => {
      if (!intelligence) return;
      const entry: FeedbackEntry = {
        value,
        type,
        organization: intelligence.organization,
        verdict,
        timestamp: new Date().toISOString(),
      };
      recordClientFeedback(entry);
      setFeedbackMap((prev) => ({ ...prev, [value]: verdict }));

      try {
        await fetch("/api/feedback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(entry),
        });
      } catch {
        // local storage still recorded
      }
    },
    [intelligence]
  );

  return {
    query,
    setQuery,
    activeLens,
    setActiveLens,
    intelligence,
    isLoading,
    error,
    suggestions,
    hasSearched,
    searchTime,
    performSearch,
    sendFeedback,
    feedbackMap,
  };
}
