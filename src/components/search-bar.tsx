"use client";

import React, { useState, useRef, useEffect } from "react";
import { Search, X, Sparkles, Command, ArrowRight, Clock, TrendingUp } from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { SearchSuggestion } from "../types/search";

interface SearchBarProps {
  query: string;
  setQuery: (q: string) => void;
  onSearch: () => void;
  suggestions: SearchSuggestion[];
  isLoading: boolean;
}

export function SearchBar({ query, setQuery, onSearch, suggestions, isLoading }: SearchBarProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex >= 0 && suggestions[selectedIndex]) {
        setQuery(suggestions[selectedIndex].text);
      }
      setShowSuggestions(false);
      onSearch();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case "trending":
        return <TrendingUp className="h-4 w-4 text-amber-500" />;
      case "history":
        return <Clock className="h-4 w-4 text-muted-foreground" />;
      case "ai":
        return <Sparkles className="h-4 w-4 text-purple-500" />;
      default:
        return <ArrowRight className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-3xl mx-auto">
      <div className="relative flex items-center">
        <Search className="absolute left-4 h-5 w-5 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Search across the web, news, code, academia..."
          className="w-full h-14 pl-12 pr-32 text-lg rounded-2xl border-2 border-border bg-card shadow-lg focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowSuggestions(true);
            setSelectedIndex(-1);
          }}
          onFocus={() => query.length > 0 && setShowSuggestions(true)}
          onKeyDown={handleKeyDown}
        />
        <div className="absolute right-3 flex items-center gap-1">
          {query && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
          <kbd className="hidden sm:inline-flex h-8 items-center gap-1 rounded-md bg-muted px-2 text-xs font-medium text-muted-foreground">
            <Command className="h-3 w-3" />
            <span>K</span>
          </kbd>
        </div>
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 rounded-xl border bg-card shadow-xl z-50 overflow-hidden">
          <div className="py-2">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                  index === selectedIndex
                    ? "bg-primary/10 text-primary"
                    : "hover:bg-muted"
                }`}
                onClick={() => {
                  setQuery(suggestion.text);
                  setShowSuggestions(false);
                  onSearch();
                }}
              >
                {getSuggestionIcon(suggestion.type)}
                <span className="flex-1 text-sm">{suggestion.text}</span>
                <span className="text-xs text-muted-foreground capitalize">
                  {suggestion.type}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
