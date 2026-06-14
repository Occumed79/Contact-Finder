"use client";

import { useState } from "react";
import { Settings, Moon, Sun, Monitor, Eye, Globe, Zap, Keyboard, Cpu, Database } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Switch } from "../../components/ui/switch";
import { Badge } from "../../components/ui/badge";
import { Header } from "../../components/header";
import { useTheme } from "next-themes";
import { useLocalStorage } from "../../hooks/use-local-storage";
import { UserSettings, SearchSource } from "../../types/search";
import { FEATURE_CAPABILITIES, type FeatureStatus } from "../../lib/feature-capabilities";
import { type CrawlerDiagnostics } from "../../lib/procurement-crawlers";

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

          {/* Advanced Features */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cpu className="h-5 w-5" />
                Advanced Features
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {FEATURE_CAPABILITIES.map((feature) => (
                  <div key={feature.id} className="flex items-start justify-between gap-4 p-3 rounded-lg border bg-muted/30">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-sm">{feature.label}</p>
                        <StatusBadge status={feature.status} />
                      </div>
                      <p className="text-xs text-muted-foreground">{feature.description}</p>
                      {feature.notes && (
                        <p className="text-xs text-muted-foreground mt-1 italic">{feature.notes}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="pt-4 border-t">
                <p className="text-sm font-medium mb-2">Procurement Crawler Status</p>
                <p className="text-xs text-muted-foreground mb-3">
                  Crawler diagnostics are logged to console during procurement searches. Status may vary based on bot detection and site changes.
                </p>
                <div className="grid grid-cols-1 gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span className="text-muted-foreground">Success: Crawler returned results</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                    <span className="text-muted-foreground">Empty: Crawler ran but found no results</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                    <span className="text-muted-foreground">Blocked: Bot detection or access denied</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-gray-500"></div>
                    <span className="text-muted-foreground">Error: Network or parsing failure</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Database Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Database Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-2">DATABASE_URL (Server-Side Only)</p>
                <p className="text-xs text-muted-foreground mb-3">
                  PostgreSQL connection string for pgvector integration. This must be configured as an environment variable on your deployment platform (e.g., Render, Vercel). The browser never sees the raw connection string.
                </p>
                <div className="p-3 bg-muted/50 rounded-lg border">
                  <p className="text-xs text-muted-foreground">
                    <strong>Configuration:</strong> Set <code className="bg-background px-1 py-0.5 rounded text-xs">DATABASE_URL</code> in your deployment environment variables.
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    <strong>Example:</strong> <code className="bg-background px-1 py-0.5 rounded text-xs">postgresql://user:password@host:port/database</code>
                  </p>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  If DATABASE_URL is not configured, the app uses local in-memory vector storage only.
                </p>
              </div>
              <div className="pt-4 border-t">
                <p className="text-sm font-medium mb-2">pgvector Capabilities</p>
                <p className="text-xs text-muted-foreground mb-3">
                  When DATABASE_URL is configured, the app automatically initializes the pgvector extension and schema on first use.
                </p>
                <div className="grid grid-cols-1 gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <span className="text-muted-foreground">Automatic schema initialization</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <span className="text-muted-foreground">Vector similarity search with cosine distance</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <span className="text-muted-foreground">Persistent document storage</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

function StatusBadge({ status }: { status: FeatureStatus }) {
  const variants: Record<FeatureStatus, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
    active: { label: "Active", variant: "default" },
    experimental: { label: "Experimental", variant: "secondary" },
    scaffold: { label: "Scaffold", variant: "outline" },
    planned: { label: "Planned", variant: "outline" },
    blocked: { label: "Blocked", variant: "destructive" },
  };
  
  const { label, variant } = variants[status];
  
  return <Badge variant={variant} className="text-xs">{label}</Badge>;
}
