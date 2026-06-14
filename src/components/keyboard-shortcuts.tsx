"use client";

import React from "react";
import { X, Command, Search, ArrowUp, ArrowDown, Filter, Bookmark, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface KeyboardShortcutsProps {
  isOpen: boolean;
  onClose: () => void;
}

const shortcuts = [
  { key: "Ctrl + K", description: "Focus search bar", icon: Search },
  { key: "Enter", description: "Execute search", icon: Search },
  { key: "↑ / ↓", description: "Navigate suggestions", icon: ArrowUp },
  { key: "Esc", description: "Close panels / Clear search", icon: X },
  { key: "Ctrl + F", description: "Toggle filters", icon: Filter },
  { key: "Ctrl + B", description: "Toggle bookmarks", icon: Bookmark },
  { key: "Ctrl + ,", description: "Open settings", icon: Settings },
  { key: "Ctrl + /", description: "Show shortcuts", icon: Command },
];

export function KeyboardShortcuts({ isOpen, onClose }: KeyboardShortcutsProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in">
      <Card className="w-full max-w-md mx-4 animate-in zoom-in-95">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Command className="h-5 w-5" />
            <h2 className="font-semibold">Keyboard Shortcuts</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="p-4">
          <div className="space-y-2">
            {shortcuts.map((shortcut, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-3">
                  <shortcut.icon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{shortcut.description}</span>
                </div>
                <kbd className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs font-mono font-medium">
                  {shortcut.key}
                </kbd>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
