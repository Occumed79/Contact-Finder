"use client";

import React from "react";
import { SlidersHorizontal, X, Globe, Clock, FileText, Shield, ImageIcon } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { SearchFilters, SearchSource } from "../types/search";

interface FilterPanelProps {
  filters: SearchFilters;
  setFilters: (filters: SearchFilters) => void;
  isOpen: boolean;
  onClose: () => void;
}

const SOURCE_OPTIONS: { value: SearchSource; label: string; icon: string }[] = [
  { value: "google", label: "Google", icon: "G" },
  { value: "bing", label: "Bing", icon: "B" },
  { value: "duckduckgo", label: "DuckDuckGo", icon: "D" },
  { value: "brave", label: "Brave", icon: "Br" },
  { value: "wikipedia", label: "Wikipedia", icon: "W" },
  { value: "github", label: "GitHub", icon: "GH" },
  { value: "stackoverflow", label: "StackOverflow", icon: "SO" },
  { value: "news", label: "News", icon: "N" },
  { value: "scholar", label: "Scholar", icon: "S" },
];

const TIME_OPTIONS = [
  { value: "any", label: "Any time" },
  { value: "day", label: "Past 24 hours" },
  { value: "week", label: "Past week" },
  { value: "month", label: "Past month" },
  { value: "year", label: "Past year" },
];

const CONTENT_OPTIONS = [
  { value: "all", label: "All content" },
  { value: "news", label: "News" },
  { value: "images", label: "Images" },
  { value: "videos", label: "Videos" },
  { value: "academic", label: "Academic" },
  { value: "code", label: "Code" },
  { value: "social", label: "Social" },
];

export function FilterPanel({ filters, setFilters, isOpen, onClose }: FilterPanelProps) {
  const toggleSource = (source: SearchSource) => {
    const newSources = filters.sources.includes(source)
      ? filters.sources.filter((s) => s !== source)
      : [...filters.sources, source];
    setFilters({ ...filters, sources: newSources });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-80 bg-card border-l shadow-2xl z-50 animate-in slide-in-from-right">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-5 w-5" />
          <h2 className="font-semibold">Filters</h2>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="p-4 space-y-6 overflow-y-auto h-[calc(100vh-65px)]">
        {/* Sources */}
        <div>
          <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Globe className="h-4 w-4 text-muted-foreground" />
            Sources
          </h3>
          <div className="flex flex-wrap gap-2">
            {SOURCE_OPTIONS.map((source) => (
              <Badge
                key={source.value}
                variant={filters.sources.includes(source.value) ? "default" : "outline"}
                className="cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => toggleSource(source.value)}
              >
                {source.label}
              </Badge>
            ))}
          </div>
        </div>

        {/* Time Range */}
        <div>
          <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            Time Range
          </h3>
          <div className="flex flex-wrap gap-2">
            {TIME_OPTIONS.map((option) => (
              <Badge
                key={option.value}
                variant={filters.timeRange === option.value ? "default" : "outline"}
                className="cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => setFilters({ ...filters, timeRange: option.value as any })}
              >
                {option.label}
              </Badge>
            ))}
          </div>
        </div>

        {/* Content Type */}
        <div>
          <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            Content Type
          </h3>
          <div className="flex flex-wrap gap-2">
            {CONTENT_OPTIONS.map((option) => (
              <Badge
                key={option.value}
                variant={filters.contentType === option.value ? "default" : "outline"}
                className="cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => setFilters({ ...filters, contentType: option.value as any })}
              >
                {option.label}
              </Badge>
            ))}
          </div>
        </div>

        {/* Options */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium flex items-center gap-2">
            <Shield className="h-4 w-4 text-muted-foreground" />
            Options
          </h3>
          
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-sm">Safe Search</span>
            <input
              type="checkbox"
              checked={filters.safeSearch}
              onChange={(e) => setFilters({ ...filters, safeSearch: e.target.checked })}
              className="rounded border-gray-300 text-primary focus:ring-primary"
            />
          </label>
          
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-sm">Exact Match</span>
            <input
              type="checkbox"
              checked={filters.exactMatch}
              onChange={(e) => setFilters({ ...filters, exactMatch: e.target.checked })}
              className="rounded border-gray-300 text-primary focus:ring-primary"
            />
          </label>
          
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-sm">Require Images</span>
            <input
              type="checkbox"
              checked={filters.requireImages}
              onChange={(e) => setFilters({ ...filters, requireImages: e.target.checked })}
              className="rounded border-gray-300 text-primary focus:ring-primary"
            />
          </label>
        </div>

        <Button
          variant="outline"
          className="w-full"
          onClick={() =>
            setFilters({
              sources: ["google", "bing", "duckduckgo", "brave", "wikipedia", "github", "stackoverflow", "news"],
              timeRange: "any",
              contentType: "all",
              safeSearch: true,
              exactMatch: false,
              requireImages: false,
            })
          }
        >
          Reset Filters
        </Button>
      </div>
    </div>
  );
}
