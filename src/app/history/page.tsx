"use client";

import { useState } from "react";
import { Clock, X, Search, Trash2, Star } from "lucide-react";
import { Header } from "../../components/header";
import { useLocalStorage } from "../../hooks/use-local-storage";
import { SearchHistoryItem } from "../../types/search";

export default function HistoryPage() {
  const [history, setHistory] = useLocalStorage<SearchHistoryItem[]>("search-history", []);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredHistory = history.filter((item) =>
    item.query.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const removeItem = (id: string) => {
    setHistory((prev) => prev.filter((item) => item.id !== id));
  };

  const clearHistory = () => {
    if (confirm("Are you sure you want to clear all history?")) {
      setHistory([]);
    }
  };

  const toggleStar = (id: string) => {
    setHistory((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, starred: !item.starred } : item
      )
    );
  };

  return (
    <div className="min-h-screen relative">
      <div className="liquid-bg">
        <div className="aurora-1" />
        <div className="aurora-2" />
        <div className="aurora-3" />
        <div className="glass-bubble bubble-1" />
        <div className="glass-bubble bubble-2" />
        <div className="glass-bubble bubble-3" />
      </div>

      <Header />

      <main className="relative z-10 container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Clock className="h-6 w-6 text-teal-300/80" />
            <h1 className="text-2xl font-bold text-white/90">Search History</h1>
            <span className="text-sm text-white/40">
              {history.length} searches
            </span>
          </div>
          {history.length > 0 && (
            <button onClick={clearHistory}
              className="glass-button text-red-300/60 hover:text-red-300/90 hover:border-red-300/30">
              <Trash2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Clear All</span>
            </button>
          )}
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
          <input
            type="text"
            placeholder="Search history..."
            className="w-full h-10 pl-10 pr-4 rounded-xl border border-white/10 bg-white/5 text-white/80 placeholder:text-white/30 outline-none focus:border-teal-300/30"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {filteredHistory.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="h-12 w-12 text-white/20 mx-auto mb-4" />
            <p className="text-white/40">
              {history.length === 0
                ? "No search history yet. Start searching!"
                : "No matching history found."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredHistory.map((item) => (
              <div key={item.id} className="glass-surface rounded-xl p-4 flex items-center gap-4 transition-all hover:bg-white/[0.07]">
                <button
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-amber-400/80 hover:bg-white/5 transition-colors"
                  onClick={() => toggleStar(item.id)}
                >
                  <Star className={`h-4 w-4 ${item.starred ? "fill-amber-400/80 text-amber-400/80" : ""}`} />
                </button>

                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white/85 truncate">{item.query}</p>
                  <p className="text-xs text-white/30">
                    {new Date(item.timestamp).toLocaleDateString()} ·{" "}
                    {item.resultCount} results ·{" "}
                    {item.filters.sources.length} sources
                  </p>
                </div>

                <button
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-red-300/70 hover:bg-white/5 transition-colors"
                  onClick={() => removeItem(item.id)}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
