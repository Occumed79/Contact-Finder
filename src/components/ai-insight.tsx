"use client";

import React, { useState } from "react";
import { Sparkles, ChevronDown, ChevronUp, Check, Copy, Zap, TrendingUp } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { AIInsight } from "../types/search";

interface AIInsightProps {
  insight: AIInsight | null;
  isLoading: boolean;
}

export function AIInsightPanel({ insight, isLoading }: AIInsightProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = async () => {
    if (insight?.summary) {
      await navigator.clipboard.writeText(insight.summary);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  if (!insight && !isLoading) return null;

  if (isLoading) {
    return (
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-5 w-5 text-primary animate-pulse" />
            <span className="font-medium">AI Analysis</span>
            <div className="ml-auto flex gap-1">
              <div className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
              <div className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
              <div className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-muted rounded w-3/4 animate-pulse" />
            <div className="h-4 bg-muted rounded w-5/6 animate-pulse" />
            <div className="h-4 bg-muted rounded w-2/3 animate-pulse" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!insight) return null;

  return (
    <Card className="border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-5 w-5 text-primary" />
          <span className="font-medium">AI Analysis</span>
          <Badge variant="outline" className="ml-auto text-xs">
            {Math.round(insight.confidence * 100)}% confidence
          </Badge>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>

        {isExpanded && (
          <div className="space-y-4 animate-in fade-in">
            <p className="text-sm leading-relaxed">{insight.summary}</p>

            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1">
                <Zap className="h-3 w-3" />
                Key Points
              </h4>
              <ul className="space-y-1.5">
                {insight.keyPoints.map((point, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                Related Topics
              </h4>
              <div className="flex flex-wrap gap-2">
                {insight.relatedTopics.map((topic, i) => (
                  <Badge key={i} variant="secondary" className="text-xs cursor-pointer hover:bg-primary/20">
                    {topic}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t">
              <span className="text-xs text-muted-foreground">
                Sources: {insight.sources.slice(0, 3).join(", ")}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs"
                onClick={handleCopy}
              >
                {isCopied ? (
                  <>
                    <Check className="h-3 w-3 mr-1" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3 mr-1" /> Copy
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
