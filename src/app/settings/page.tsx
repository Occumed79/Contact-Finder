"use client";

import { useState } from "react";
import { Settings, Moon, Sun, Monitor, Eye, Globe, Zap, Keyboard } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Switch } from "../../components/ui/switch";
import { Header } from "../../components/header";
import { useTheme } from "next-themes";
import { useLocalStorage } from "../../hooks/use-local-storage";
import { UserSettings, SearchSource } from "../../types/search";

const defaultSettings: UserSettings = {
  theme: "system",
  defaultSources: ["google", "bing", "duckduckgo", "brave", "wikipedia", "github", "stackoverflow", "news"],
  resultsPerPage: 20,
  autoSummarize: true,
  safeSearch: true,
  openInNewTab: true,
  showFavicons: true,
  showDescriptions: true,
  keyboardShortcuts: true,
  searchDelay: 300,
  preferredLanguage: "en",
  region: "us",
  aiModel: "gpt-4o-mini",
};

const sourceOptions: { value: SearchSource; label: string }[] = [
  { value: "google", label: "Google" },
  { value: "bing", label: "Bing" },
  { value: "duckduckgo", label: "DuckDuckGo" },
  { value: "brave", label: "Brave" },
  { value: "wikipedia", label: "Wikipedia" },
  { value: "github", label: "GitHub" },
  { value: "stackoverflow", label: "StackOverflow" },
  { value: "news", label: "News" },
  { value: "scholar", label: "Scholar" },
  { value: "semantic", label: "Semantic AI" },
];

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [settings, setSettings] = useLocalStorage<UserSettings>("user-settings", defaultSettings);
  const [saved, setSaved] = useState(false);

  const updateSetting = <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const toggleSource = (source: SearchSource) => {
    setSettings((prev) => {
      const sources = prev.defaultSources.includes(source)
        ? prev.defaultSources.filter((s) => s !== source)
        : [...prev.defaultSources, source];
      return { ...prev, defaultSources: sources };
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header onToggleFilters={() => {}} onToggleShortcuts={() => {}} />

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="flex items-center gap-3 mb-6">
          <Settings className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Settings</h1>
          {saved && (
            <span className="text-sm text-green-600 animate-in fade-in">
              Saved!
            </span>
          )}
        </div>

        <div className="space-y-6">
          {/* Appearance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5" />
                Appearance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Theme</label>
                <div className="flex gap-2">
                  {[
                    { value: "light", icon: Sun, label: "Light" },
                    { value: "dark", icon: Moon, label: "Dark" },
                    { value: "system", icon: Monitor, label: "System" },
                  ].map((option) => (
                    <Button
                      key={option.value}
                      variant={theme === option.value ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => setTheme(option.value)}
                    >
                      <option.icon className="h-4 w-4 mr-2" />
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sources */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Default Sources
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {sourceOptions.map((source) => (
                  <Button
                    key={source.value}
                    variant={
                      settings.defaultSources.includes(source.value)
                        ? "secondary"
                        : "ghost"
                    }
                    size="sm"
                    onClick={() => toggleSource(source.value)}
                  >
                    {source.label}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Search Behavior */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Search Behavior
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Auto-summarize</p>
                  <p className="text-sm text-muted-foreground">
                    Generate AI summaries for search results
                  </p>
                </div>
                <Switch
                  checked={settings.autoSummarize}
                  onCheckedChange={(v) => updateSetting("autoSummarize", v)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Safe Search</p>
                  <p className="text-sm text-muted-foreground">
                    Filter out explicit content
                  </p>
                </div>
                <Switch
                  checked={settings.safeSearch}
                  onCheckedChange={(v) => updateSetting("safeSearch", v)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Open in New Tab</p>
                  <p className="text-sm text-muted-foreground">
                    Open result links in a new tab
                  </p>
                </div>
                <Switch
                  checked={settings.openInNewTab}
                  onCheckedChange={(v) => updateSetting("openInNewTab", v)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Show Favicons</p>
                  <p className="text-sm text-muted-foreground">
                    Display website icons in results
                  </p>
                </div>
                <Switch
                  checked={settings.showFavicons}
                  onCheckedChange={(v) => updateSetting("showFavicons", v)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Show Descriptions</p>
                  <p className="text-sm text-muted-foreground">
                    Display result descriptions
                  </p>
                </div>
                <Switch
                  checked={settings.showDescriptions}
                  onCheckedChange={(v) => updateSetting("showDescriptions", v)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Keyboard */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Keyboard className="h-5 w-5" />
                Keyboard Shortcuts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Enable Shortcuts</p>
                  <p className="text-sm text-muted-foreground">
                    Use keyboard shortcuts for faster navigation
                  </p>
                </div>
                <Switch
                  checked={settings.keyboardShortcuts}
                  onCheckedChange={(v) => updateSetting("keyboardShortcuts", v)}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
