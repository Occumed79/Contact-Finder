"use client";

import { useState } from "react";
import { Clock, X, Search, Trash2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Header } from "@/components/header";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { SearchHistoryItem } from "@/types/search";

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
    <div className="min-h-screen bg-background">
      <Header onToggleFilters={() => {}} onToggleShortcuts={() => {}} />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Clock className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Search History</h1>
            <span className="text-sm text-muted-foreground">
              {history.length} searches
            </span>
          </div>
          {history.length > 0 && (
            <Button variant="destructive" size="sm" onClick={clearHistory}>
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All
            </Button>
          )}
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search history..."
            className="w-full h-10 pl-10 pr-4 rounded-lg border bg-card"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {filteredHistory.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {history.length === 0
                ? "No search history yet. Start searching!"
                : "No matching history found."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredHistory.map((item) => (
              <Card key={item.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 flex items-center gap-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => toggleStar(item.id)}
                  >
                    <Star
                      className={`h-4 w-4 ${
                        item.starred ? "fill-amber-500 text-amber-500" : "text-muted-foreground"
                      }`}
                    />
                  </Button>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{item.query}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(item.timestamp).toLocaleDateString()} ·{" "}
                      {item.resultCount} results ·{" "}
                      {item.filters.sources.length} sources
                    </p>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => removeItem(item.id)}
                  >
                    <X className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
