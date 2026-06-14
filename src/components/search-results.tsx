"use client";

import React from "react";
import { ExternalLink, Star, Clock, Globe, Bookmark } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SearchResult, ViewMode } from "@/types/search";
import { useLocalStorage } from "@/hooks/use-local-storage";

interface SearchResultsProps {
  results: SearchResult[];
  viewMode: ViewMode;
  onLoadMore: () => void;
  hasMore: boolean;
  isLoading: boolean;
}

export function SearchResults({ results, viewMode, onLoadMore, hasMore, isLoading }: SearchResultsProps) {
  const [bookmarks, setBookmarks] = useLocalStorage<string[]>("search-bookmarks", []);

  const toggleBookmark = (id: string) => {
    setBookmarks((prev) =>
      prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id]
    );
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    return `${Math.floor(days / 30)} months ago`;
  };

  const getSourceBadgeClass = (source: string) => {
    return `source-badge ${source}`;
  };

  if (results.length === 0 && !isLoading) {
    return (
      <div className="text-center py-12">
        <Globe className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium">No results found</h3>
        <p className="text-muted-foreground">Try adjusting your search terms or filters</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {results.map((result, index) => (
        <Card
          key={result.id}
          className="group hover:shadow-lg transition-all duration-200 animate-in fade-in"
          style={{ animationDelay: `${index * 50}ms` }}
        >
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="mt-1">
                <img
                  src={`https://www.google.com/s2/favicons?domain=${result.domain}&sz=32`}
                  alt=""
                  className="w-5 h-5 rounded"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='12' cy='12' r='10'/%3E%3Cline x1='2' y1='12' x2='22' y2='12'/%3E%3Cpath d='M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z'/%3E%3C/svg%3E";
                  }}
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={getSourceBadgeClass(result.source)}>
                    {result.source}
                  </span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDate(result.timestamp)}
                  </span>
                  <span className="text-xs text-muted-foreground ml-auto">
                    Score: {(result.score * 100).toFixed(0)}%
                  </span>
                </div>

                <a
                  href={result.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block group/link"
                >
                  <h3 className="text-lg font-medium text-primary hover:underline line-clamp-1">
                    {result.title}
                  </h3>
                  <p className="text-sm text-green-700 dark:text-green-400 line-clamp-1 mt-0.5">
                    {result.url}
                  </p>
                </a>

                <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2">
                  {result.description}
                </p>

                {result.content && (
                  <p className="text-xs text-muted-foreground mt-2 line-clamp-2 bg-muted/50 rounded p-2">
                    {result.content}
                  </p>
                )}

                <div className="flex items-center gap-2 mt-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => window.open(result.url, "_blank")}
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Visit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => toggleBookmark(result.id)}
                  >
                    <Bookmark
                      className={`h-3 w-3 mr-1 ${bookmarks.includes(result.id) ? "fill-current text-primary" : ""}`}
                    />
                    {bookmarks.includes(result.id) ? "Saved" : "Save"}
                  </Button>
                  <Badge variant="outline" className="text-xs h-7">
                    <Star className="h-3 w-3 mr-1 text-amber-500" />
                    Rank #{result.rank}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {hasMore && (
        <div className="flex justify-center py-4">
          <Button
            onClick={onLoadMore}
            disabled={isLoading}
            className="min-w-[200px]"
          >
            {isLoading ? (
              <>
                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                Loading...
              </>
            ) : (
              "Load More Results"
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
