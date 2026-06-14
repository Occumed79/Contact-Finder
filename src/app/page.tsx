"use client";

import { useState, useEffect, useCallback } from "react";
import { Filter, LayoutGrid, List, Layers, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/header";
import { SearchBar } from "@/components/search-bar";
import { FilterPanel } from "@/components/filter-panel";
import { AIInsightPanel } from "@/components/ai-insight";
import { SearchResults } from "@/components/search-results";
import { KeyboardShortcuts } from "@/components/keyboard-shortcuts";
import { useSearch } from "@/hooks/use-search";
import { ViewMode } from "@/types/search";

export default function Home() {
  const {
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
    hasMore,
  } = useSearch();

  const [showFilters, setShowFilters] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  // Keyboard shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case "f":
          e.preventDefault();
          setShowFilters((prev: boolean) => !prev);
          break;
        case "/":
          e.preventDefault();
          setShowShortcuts((prev: boolean) => !prev);
          break;
      }
    }
    if (e.key === "Escape") {
      setShowFilters(false);
      setShowShortcuts(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const viewModeIcons = {
    grid: LayoutGrid,
    list: List,
    compact: Layers,
    cards: Sparkles,
  };

  return (
    <div className="min-h-screen bg-background">
      <Header
        onToggleFilters={() => setShowFilters(true)}
        onToggleShortcuts={() => setShowShortcuts(true)}
      />

      <main className="container mx-auto px-4 py-8">
        {/* Hero Search */}
        <div className="max-w-4xl mx-auto mb-8">
          {!hasSearched && (
            <div className="text-center mb-8 animate-in fade-in">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                <span className="text-gradient">Omni</span>Search
              </h1>
              <p className="text-lg text-muted-foreground max-w-xl mx-auto">
                AI-powered multi-source search aggregator. Search across Google, Bing, 
                DuckDuckGo, Wikipedia, GitHub, StackOverflow, and more — all in one place.
              </p>
            </div>
          )}

          <SearchBar
            query={query}
            setQuery={setQuery}
            onSearch={performSearch}
            suggestions={suggestions}
            isLoading={isLoading}
          />
        </div>

        {hasSearched && (
          <div className="max-w-4xl mx-auto animate-in slide-in-from-bottom">
            {/* Results Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">
                  {totalResults.toLocaleString()} results in {searchTime.toFixed(2)}ms
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8"
                  onClick={() => setShowFilters(true)}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                </Button>
              </div>

              <div className="flex items-center gap-1">
                {(["list", "grid", "compact"] as ViewMode[]).map((mode) => {
                  const Icon = viewModeIcons[mode];
                  return (
                    <Button
                      key={mode}
                      variant={viewMode === mode ? "secondary" : "ghost"}
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setViewMode(mode)}
                    >
                      <Icon className="h-4 w-4" />
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* AI Insight */}
            <div className="mb-6">
              <AIInsightPanel insight={aiInsight} isLoading={isLoading && results.length === 0} />
            </div>

            {/* Error */}
            {error && (
              <div className="mb-6 p-4 rounded-lg border border-destructive bg-destructive/10 text-destructive">
                <p className="font-medium">Error</p>
                <p className="text-sm">{error}</p>
              </div>
            )}

            {/* Results */}
            <SearchResults
              results={results}
              viewMode={viewMode}
              onLoadMore={loadMore}
              hasMore={hasMore}
              isLoading={isLoading}
            />
          </div>
        )}

        {/* Initial state - feature highlights */}
        {!hasSearched && !isLoading && (
          <div className="max-w-4xl mx-auto mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-bottom">
            {[
              {
                title: "Multi-Source Search",
                description: "Aggregates results from 10+ search engines and databases simultaneously.",
                icon: "🔍",
              },
              {
                title: "AI-Powered Insights",
                description: "Get intelligent summaries, key points, and related topics automatically.",
                icon: "🧠",
              },
              {
                title: "Advanced Filtering",
                description: "Filter by source, time range, content type, and more.",
                icon: "⚡",
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="p-6 rounded-xl border bg-card hover:shadow-lg transition-all duration-300 group"
              >
                <div className="text-3xl mb-4 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Filter Panel */}
      <FilterPanel
        filters={filters}
        setFilters={setFilters}
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
      />

      {/* Keyboard Shortcuts */}
      <KeyboardShortcuts
        isOpen={showShortcuts}
        onClose={() => setShowShortcuts(false)}
      />
    </div>
  );
}
