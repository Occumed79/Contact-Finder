"use client";

import { useState } from "react";
import { Bookmark, X, Search, ExternalLink, Folder, Tag } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
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
    <div className="min-h-screen bg-background">
      <Header onToggleFilters={() => {}} onToggleShortcuts={() => {}} />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Bookmark className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Bookmarks</h1>
            <span className="text-sm text-muted-foreground">
              {bookmarks.length} saved
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search bookmarks..."
              className="w-full h-10 pl-10 pr-4 rounded-lg border bg-card"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {folders.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={selectedFolder === null ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setSelectedFolder(null)}
              >
                <Folder className="h-4 w-4 mr-1" />
                All
              </Button>
              {folders.map((folder) => (
                <Button
                  key={folder}
                  variant={selectedFolder === folder ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setSelectedFolder(folder)}
                >
                  <Folder className="h-4 w-4 mr-1" />
                  {folder}
                </Button>
              ))}
            </div>
          )}
        </div>

        {filteredBookmarks.length === 0 ? (
          <div className="text-center py-12">
            <Bookmark className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {bookmarks.length === 0
                ? "No bookmarks yet. Save results from your searches!"
                : "No matching bookmarks found."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredBookmarks.map((item) => (
              <Card key={item.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="mt-1">
                      <img
                        src={`https://www.google.com/s2/favicons?domain=${new URL(item.url).hostname}&sz=32`}
                        alt=""
                        className="w-5 h-5 rounded"
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
                        className="font-medium hover:text-primary hover:underline"
                      >
                        {item.title}
                      </a>
                      <p className="text-sm text-muted-foreground mt-1">
                        {item.description}
                      </p>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <Badge variant="outline" className="text-xs">
                          <Folder className="h-3 w-3 mr-1" />
                          {item.folder}
                        </Badge>
                        {item.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            <Tag className="h-3 w-3 mr-1" />
                            {tag}
                          </Badge>
                        ))}
                        <span className="text-xs text-muted-foreground ml-auto">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => window.open(item.url, "_blank")}
                      >
                        <ExternalLink className="h-4 w-4 text-muted-foreground" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => removeBookmark(item.id)}
                      >
                        <X className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
