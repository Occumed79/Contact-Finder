"use client";

import Link from "next/link";
import { Clock as ClockIcon, Bookmark, Settings } from "lucide-react";

function OccuMedLogo({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 60" className={className} fill="none">
      <defs>
        <linearGradient id="logoGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(220,235,255,0.95)" />
          <stop offset="100%" stopColor="rgba(180,210,240,0.7)" />
        </linearGradient>
        <filter id="logoGlow">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <path d="M8 48 L8 12 C8 8 14 8 16 12 L24 36 L32 12 C34 8 40 8 40 12 L40 48"
            stroke="url(#logoGrad)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"
            fill="none" filter="url(#logoGlow)" />
      <text x="52" y="38" fill="url(#logoGrad)" fontSize="22" fontWeight="600"
            fontFamily="-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', Arial, sans-serif"
            letterSpacing="1.5" filter="url(#logoGlow)">
        OCCU-MED
      </text>
    </svg>
  );
}

export function Header() {
  return (
    <header className="relative z-10 flex items-center justify-between px-6 py-5">
      <Link href="/" className="logo-glow">
        <OccuMedLogo className="h-9 w-auto" />
      </Link>
      <div className="flex items-center gap-2">
        <Link href="/history" className="glass-button">
          <ClockIcon className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">History</span>
        </Link>
        <Link href="/bookmarks" className="glass-button">
          <Bookmark className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Bookmarks</span>
        </Link>
        <Link href="/settings" className="glass-button">
          <Settings className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Settings</span>
        </Link>
      </div>
    </header>
  );
}
