"use client";

import React, { useEffect, useState } from "react";
import { Search, Settings, History, Bookmark, Moon, Sun, Zap, Keyboard, Menu } from "lucide-react";
import { Button } from "./ui/button";
import Link from "next/link";
import { useTheme } from "next-themes";

interface HeaderProps {
  onToggleFilters: () => void;
  onToggleShortcuts: () => void;
}

export function Header({ onToggleFilters, onToggleShortcuts }: HeaderProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-md">
      <div className="container flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
          </Button>
          <Link href="/" className="flex items-center gap-2">
            <div className="relative">
              <Search className="h-6 w-6 text-primary" />
              <Zap className="h-3 w-3 text-amber-500 absolute -top-1 -right-1" />
            </div>
            <span className="font-bold text-lg hidden sm:inline">
              <span className="text-gradient">Omni</span>Search
            </span>
          </Link>
        </div>

        <nav className="hidden md:flex items-center gap-1">
          <Link href="/history">
            <Button variant="ghost" size="sm" className="h-8">
              <History className="h-4 w-4 mr-2" />
              History
            </Button>
          </Link>
          <Link href="/bookmarks">
            <Button variant="ghost" size="sm" className="h-8">
              <Bookmark className="h-4 w-4 mr-2" />
              Bookmarks
            </Button>
          </Link>
          <Link href="/settings">
            <Button variant="ghost" size="sm" className="h-8">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </Link>
        </nav>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {!mounted ? (
              <Sun className="h-4 w-4 opacity-0" />
            ) : resolvedTheme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hidden md:flex"
            onClick={onToggleShortcuts}
          >
            <Keyboard className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
