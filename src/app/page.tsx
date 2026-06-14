"use client";

import {
  Activity,
  ArrowUpDown,
  BookOpen,
  Bookmark,
  Briefcase,
  Building2,
  Code,
  Command,
  Database,
  Download,
  ExternalLink,
  FileText,
  Filter,
  GraduationCap,
  History,
  Loader2,
  Newspaper,
  Search,
  Settings,
  Sparkles,
  Stethoscope,
  Zap,
  Scale,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import { useSearch } from "../hooks/use-search";
import type { SearchLens, ScrapedResult } from "../types/search";

const LENSES: { id: SearchLens; label: string; icon: LucideIcon }[] = [
  { id: "web", label: "Web", icon: Search },
  { id: "pdf", label: "PDF", icon: FileText },
  { id: "government", label: "Government", icon: Building2 },
  { id: "procurement", label: "Procurement", icon: Database },
  { id: "pricing", label: "Pricing", icon: Zap },
  { id: "provider", label: "Provider", icon: Stethoscope },
  { id: "technical", label: "Technical", icon: Code },
  { id: "news", label: "News", icon: Newspaper },
  { id: "legal", label: "Legal", icon: Scale },
  { id: "medical", label: "Medical", icon: Stethoscope },
  { id: "academic", label: "Academic", icon: GraduationCap },
  { id: "financial", label: "Financial", icon: Briefcase },
];

const FEATURE_CARDS = [
  {
    icon: Activity,
    title: "Multi-engine aggregation",
    text: "Blends DuckDuckGo, Bing, Google, and optional search backbones into one ranked result stream.",
  },
  {
    icon: Sparkles,
    title: "Query intelligence",
    text: "Expands searches with lens-specific terms, operators, and intent signals before ranking.",
  },
  {
    icon: ArrowUpDown,
    title: "Signal scoring",
    text: "Boosts useful sources, structured opportunities, PDFs, government domains, and provider signals.",
  },
];

function sourceClass(source: string) {
  const normalized = source.toLowerCase();
  if (normalized.includes("google")) return "source-pill source-google";
  if (normalized.includes("bing")) return "source-pill source-bing";
  if (normalized.includes("duck")) return "source-pill source-duck";
  return "source-pill";
}

function ResultCard({ result, index }: { result: ScrapedResult; index: number }) {
  const score = Number.isFinite(result.score) ? Math.round(result.score) : 0;

  return (
    <article className="liquid-result-card liquid-glass">
      <div className="result-topline">
        <span className="result-rank">#{index + 1}</span>
        <span className={sourceClass(result.source)}>{result.source}</span>
        {result.resultType && <span className="result-type">{result.resultType}</span>}
        <span className="result-score">score {score}</span>
      </div>

      <h3 className="result-title">
        <a href={result.url} target="_blank" rel="noreferrer">
          {result.title || result.domain || result.url}
          <ExternalLink className="result-external" aria-hidden="true" />
        </a>
      </h3>

      {result.description && <p className="result-description">{result.description}</p>}

      <div className="result-footer">
        <span className="result-domain">{result.domain}</span>
        {result.spamScore ? <span className="result-warning">spam signal {result.spamScore}</span> : null}
      </div>
    </article>
  );
}

export default function Home() {
  const {
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
  } = useSearch();

  const [sortBy, setSortBy] = useState<"score" | "rank" | "source">("score");
  const [filterSource, setFilterSource] = useState<string>("");

  const sources = useMemo(() => {
    return Array.from(new Set(scrapedResults.map((result) => result.source))).sort();
  }, [scrapedResults]);

  const filteredResults = useMemo(() => {
    const results = scrapedResults.filter((result) => !filterSource || result.source === filterSource);

    return [...results].sort((a, b) => {
      if (sortBy === "rank") return a.rank - b.rank;
      if (sortBy === "source") return a.source.localeCompare(b.source);
      return b.score - a.score;
    });
  }, [scrapedResults, filterSource, sortBy]);

  function submitSearch(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    if (!query.trim() || isLoading) return;
    performSearch();
  }

  function exportResults(format: "json" | "csv") {
    const safeQuery = (query || "search")
      .replace(/[^a-zA-Z0-9-]/g, "_")
      .substring(0, 50);
    const timestamp = new Date().toISOString();

    if (format === "json") {
      const data = JSON.stringify(
        {
          metadata: {
            query,
            lens,
            timestamp,
            resultCount: filteredResults.length,
          },
          intelligence,
          results: filteredResults,
        },
        null,
        2,
      );
      const blob = new Blob([data], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `ultra-search-${safeQuery}-${timestamp}.json`;
      anchor.click();
      URL.revokeObjectURL(url);
      return;
    }

    const headers = ["Title", "URL", "Description", "Source", "Score", "Rank"];
    const rows = filteredResults.map((result) => [
      `"${(result.title || "").replace(/"/g, '""')}"`,
      `"${result.url}"`,
      `"${(result.description || "").replace(/"/g, '""')}"`,
      `"${result.source}"`,
      result.score ?? 0,
      result.rank ?? 0,
    ]);
    const csv = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `ultra-search-${safeQuery}-${timestamp}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="ultra-liquid-page">
      <div className="liquid-aurora" aria-hidden="true" />
      <div className="liquid-grid" aria-hidden="true" />
      <div className="liquid-orb orb-one" aria-hidden="true" />
      <div className="liquid-orb orb-two" aria-hidden="true" />
      <div className="liquid-orb orb-three" aria-hidden="true" />
      <div className="liquid-sweep" aria-hidden="true" />

      <section className="liquid-shell">
        <header className="liquid-topbar liquid-glass">
          <a className="liquid-brand" href="/" aria-label="UltraSearch home">
            <span className="brand-mark">
              <Search className="brand-search" aria-hidden="true" />
              <Zap className="brand-zap" aria-hidden="true" />
            </span>
            <span>
              <strong>Ultra</strong>Search
            </span>
          </a>

          <nav className="liquid-nav" aria-label="App navigation">
            <a href="/history"><History aria-hidden="true" />History</a>
            <a href="/bookmarks"><Bookmark aria-hidden="true" />Bookmarks</a>
            <a href="/settings"><Settings aria-hidden="true" />Settings</a>
          </nav>
        </header>

        <section className="liquid-hero">
          <p className="eyebrow"><span /> Kagi-style browser intelligence without API keys</p>
          <h1>
            Search through a <em>liquid glass</em> command surface.
          </h1>
          <p className="hero-copy">
            Multi-engine aggregation, query expansion, structured signals, document extraction, and scoring wrapped in a dark luminous macOS-style interface.
          </p>
        </section>

        <section className="liquid-command liquid-glass">
          <div className="lens-ribbon" aria-label="Search lenses">
            {LENSES.map((item) => {
              const Icon = item.icon;
              const active = lens === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setLens(item.id)}
                  className={active ? "lens-chip active" : "lens-chip"}
                >
                  <Icon aria-hidden="true" />
                  {item.label}
                </button>
              );
            })}
          </div>

          <form className="search-composer" onSubmit={submitSearch}>
            <Search className="composer-icon" aria-hidden="true" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search RFPs, providers, pricing, PDFs, technical docs..."
              aria-label="Search query"
            />
            <div className="composer-actions">
              <kbd><Command aria-hidden="true" />K</kbd>
              <button type="submit" disabled={isLoading || !query.trim()}>
                {isLoading ? <Loader2 className="spin" aria-hidden="true" /> : <Sparkles aria-hidden="true" />}
                {isLoading ? "Searching" : "Search"}
              </button>
            </div>
          </form>

          {suggestions.length > 0 && query && !hasSearched && (
            <div className="suggestion-row">
              {suggestions.slice(0, 4).map((suggestion) => (
                <button
                  type="button"
                  key={suggestion.text}
                  onClick={() => setQuery(suggestion.text)}
                >
                  {suggestion.text}
                </button>
              ))}
            </div>
          )}
        </section>

        {!hasSearched && (
          <section className="feature-grid">
            {FEATURE_CARDS.map((feature) => {
              const Icon = feature.icon;
              return (
                <article key={feature.title} className="feature-card liquid-glass">
                  <Icon aria-hidden="true" />
                  <h2>{feature.title}</h2>
                  <p>{feature.text}</p>
                </article>
              );
            })}
          </section>
        )}

        {hasSearched && (
          <section className="results-zone">
            <div className="results-toolbar liquid-glass">
              <div>
                <span className="results-count">{filteredResults.length}</span>
                <span className="results-label">results</span>
                <span className="results-meta">{searchTime.toFixed(0)}ms · {lens}</span>
              </div>

              <div className="toolbar-controls">
                <label>
                  <Filter aria-hidden="true" />
                  <select value={filterSource} onChange={(event) => setFilterSource(event.target.value)}>
                    <option value="">All sources</option>
                    {sources.map((source) => (
                      <option value={source} key={source}>{source}</option>
                    ))}
                  </select>
                </label>

                <label>
                  <ArrowUpDown aria-hidden="true" />
                  <select value={sortBy} onChange={(event) => setSortBy(event.target.value as "score" | "rank" | "source")}>
                    <option value="score">Score</option>
                    <option value="rank">Rank</option>
                    <option value="source">Source</option>
                  </select>
                </label>

                <button type="button" onClick={() => exportResults("json")}><Download aria-hidden="true" />JSON</button>
                <button type="button" onClick={() => exportResults("csv")}><Download aria-hidden="true" />CSV</button>
              </div>
            </div>

            {error && (
              <div className="error-panel liquid-glass">
                <strong>Search failed</strong>
                <span>{error}</span>
              </div>
            )}

            {intelligence && (
              <article className="intel-panel liquid-glass">
                <div className="intel-heading">
                  <Sparkles aria-hidden="true" />
                  <h2>Search intelligence</h2>
                  <span>{intelligence.confidence}% confidence</span>
                </div>
                <p>{intelligence.summary || `Results for “${intelligence.query}” using the ${intelligence.lens} lens.`}</p>

                {intelligence.queryExpansions.length > 0 && (
                  <div className="intel-chips">
                    {intelligence.queryExpansions.slice(0, 8).map((expansion) => (
                      <button
                        type="button"
                        key={expansion}
                        onClick={() => setQuery(expansion)}
                      >
                        {expansion}
                      </button>
                    ))}
                  </div>
                )}

                {intelligence.signals.length > 0 && (
                  <div className="signal-strip">
                    {intelligence.signals.slice(0, 8).map((signal) => (
                      <span key={`${signal.name}-${signal.score}`} title={signal.description}>
                        {signal.name} {signal.score > 0 ? "+" : ""}{signal.score}
                      </span>
                    ))}
                  </div>
                )}
              </article>
            )}

            <div className="results-list">
              {filteredResults.map((result, index) => (
                <ResultCard key={`${result.url}-${index}`} result={result} index={index} />
              ))}
            </div>

            {!isLoading && filteredResults.length === 0 && !error && (
              <div className="empty-panel liquid-glass">
                <BookOpen aria-hidden="true" />
                <h2>No results came back yet.</h2>
                <p>Try a broader query or switch lenses.</p>
              </div>
            )}
          </section>
        )}
      </section>
    </main>
  );
}
