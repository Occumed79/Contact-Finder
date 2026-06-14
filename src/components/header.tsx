"use client";

import Link from "next/link";
import { Clock as ClockIcon, Bookmark, Shield } from "lucide-react";

export function Header() {
  return (
    <header className="relative z-10 flex items-center justify-between px-6 py-5 border-b border-white/5">
      <Link href="/" className="flex items-center gap-2">
        <Shield className="w-6 h-6 text-spy-cyan glow-cyan" />
        <span className="text-lg font-bold tracking-wider text-white spy-text">
          CONTACT<span className="text-spy-cyan">INTEL</span>
        </span>
      </Link>
      <div className="flex items-center gap-2">
        <Link href="/history" className="glass-panel px-3 py-1.5 rounded-full text-white/70 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2 text-sm">
          <ClockIcon className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">History</span>
        </Link>
        <Link href="/bookmarks" className="glass-panel px-3 py-1.5 rounded-full text-white/70 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2 text-sm">
          <Bookmark className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Bookmarks</span>
        </Link>
      </div>
    </header>
  );
}
