"use client";

import { useState } from "react";
import { Bookmark, X, Search, ExternalLink, Folder, Tag } from "lucide-react";
import { Header } from "../../components/header";
import { useLocalStorage } from "../../hooks/use-local-storage";
import { BookmarkItem } from "../../types/search";

export default function BookmarksPage() {
  const [bookmarks, setBookmarks] = useLocalStorage<BookmarkItem[]>("bookmarks-list", []);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);

  const folders = Array.from(new Set(bookmarks.map((b) => b.folder)));

  const filteredBookmarks = bookmarks.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.tags.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesFolder = !selectedFolder || item.folder === selectedFolder;
    return matchesSearch && matchesFolder;
  });

  const removeBookmark = (id: string) => {
    setBookmarks((prev) => prev.filter((item) => item.id !== id));
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
            <Bookmark className="h-6 w-6 text-teal-300/80" />
            <h1 className="text-2xl font-bold text-white/90">Bookmarks</h1>
            <span className="text-sm text-white/40">
              {bookmarks.length} saved
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
            <input
              type="text"
              placeholder="Search bookmarks..."
              className="w-full h-10 pl-10 pr-4 rounded-xl border border-white/10 bg-white/5 text-white/80 placeholder:text-white/30 outline-none focus:border-teal-300/30"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {folders.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setSelectedFolder(null)}
                className={`text-[12px] px-3 py-1.5 rounded-full transition-all border ${
                  selectedFolder === null
                    ? 'bg-white/10 border-white/20 text-white/90'
                    : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                }`}
              >
                All
              </button>
              {folders.map((folder) => (
                <button
                  key={folder}
                  onClick={() => setSelectedFolder(folder)}
                  className={`text-[12px] px-3 py-1.5 rounded-full transition-all border ${
                    selectedFolder === folder
                      ? 'bg-white/10 border-white/20 text-white/90'
                      : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                  }`}
                >
                  {folder}
                </button>
              ))}
            </div>
          )}
        </div>

        {filteredBookmarks.length === 0 ? (
          <div className="text-center py-12">
            <Bookmark className="h-12 w-12 text-white/20 mx-auto mb-4" />
            <p className="text-white/40">
              {bookmarks.length === 0
                ? "No bookmarks yet. Save results from your searches!"
                : "No matching bookmarks found."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredBookmarks.map((item) => (
              <div key={item.id} className="glass-surface rounded-xl p-4 transition-all hover:bg-white/[0.07]">
                <div className="flex items-start gap-4">
                  <div className="mt-1">
                    <img
                      src={`https://www.google.com/s2/favicons?domain=${(() => {
                        try { return new URL(item.url).hostname; } catch { return "example.com"; }
                      })()}&sz=32`}
                      alt=""
                      className="w-5 h-5 rounded opacity-60"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-white/85 hover:text-teal-300/90 transition-colors"
                    >
                      {item.title}
                    </a>
                    <p className="text-sm text-white/40 mt-1">
                      {item.description}
                    </p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className="text-[11px] px-2 py-0.5 rounded-full border border-white/10 text-white/40">
                        {item.folder}
                      </span>
                      {item.tags.map((tag) => (
                        <span key={tag} className="text-[11px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/40">
                          {tag}
                        </span>
                      ))}
                      <span className="text-[11px] text-white/25 ml-auto">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-1">
                    <button
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-white/70 hover:bg-white/5 transition-colors"
                      onClick={() => window.open(item.url, "_blank")}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </button>
                    <button
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-red-300/70 hover:bg-white/5 transition-colors"
                      onClick={() => removeBookmark(item.id)}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
