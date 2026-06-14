"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Phone, Mail, Printer, Linkedin, Globe,
  Shield, Zap, Eye, Target, Radio, Database, Activity,
  ChevronRight, Copy, ExternalLink, AlertTriangle,
  CheckCircle2, Wifi, Crosshair, Radar as RadarIcon,
} from "lucide-react";
import MatrixRain from "../components/MatrixRain";
import Radar from "../components/Radar";
import GlobeVis from "../components/Globe";
import { useSearch } from "../hooks/use-search";
import { type Vertical } from "../types/search";

const VERTICALS = [
  { id: "contact", label: "CONTACT", icon: Phone, color: "text-spy-cyan" },
  { id: "procurement", label: "PROCUREMENT", icon: Target, color: "text-spy-green" },
  { id: "provider", label: "PROVIDER", icon: Database, color: "text-spy-purple" },
  { id: "pricing", label: "PRICING", icon: Activity, color: "text-spy-amber" },
  { id: "general", label: "GENERAL", icon: Zap, color: "text-slate-400" },
];

function ContactTypeIcon({ type }: { type: string }) {
  switch (type) {
    case "phone": return <Phone className="w-4 h-4 text-spy-green" />;
    case "email": return <Mail className="w-4 h-4 text-spy-cyan" />;
    case "fax": return <Printer className="w-4 h-4 text-spy-amber" />;
    case "linkedin": return <Linkedin className="w-4 h-4 text-blue-400" />;
    case "website": return <Globe className="w-4 h-4 text-spy-purple" />;
    default: return <Globe className="w-4 h-4 text-slate-400" />;
  }
}

export default function Home() {
  const {
    query, setQuery, vertical, setVertical,
    intelligence, isLoading, error,
    hasSearched, performSearch,
  } = useSearch();

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [showMatrix, setShowMatrix] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  const addLog = (message: string) => {
    setLogs((prev) => [...prev.slice(-20), `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  const copyToClipboard = async (value: string, id: string) => {
    await navigator.clipboard.writeText(value);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLogs([]);
    addLog(`Vertical: ${vertical.toUpperCase()}`);
    addLog("Expanding query semantics...");
    await performSearch();
    if (intelligence) {
      addLog(`INTELLIGENCE ACQUIRED: ${intelligence.contacts?.length || 0} vectors | Confidence: ${intelligence.confidence}%`);
    }
  };

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div className="min-h-screen bg-spy-black spy-grid-bg relative overflow-hidden">
      {showMatrix && <MatrixRain />}
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-spy-cyan/5 rounded-full blur-3xl pointer-events-none z-10" />
      <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-spy-purple/5 rounded-full blur-3xl pointer-events-none z-10" />

      {isLoading && (
        <div className="fixed inset-0 pointer-events-none z-50">
          <div className="scan-line" />
        </div>
      )}

      <header className="relative z-20 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-spy-cyan glow-cyan" />
            <div>
              <h1 className="text-lg font-bold tracking-wider text-white spy-text">
                CONTACT<span className="text-spy-cyan">INTEL</span>
              </h1>
              <div className="flex items-center gap-2">
                <Radio className="w-3 h-3 text-spy-green data-pulse" />
                <span className="text-[10px] spy-text text-spy-green tracking-widest">SYSTEM ACTIVE</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => setShowMatrix(!showMatrix)} className="glass-panel px-3 py-1.5 rounded-full hover:bg-white/5 transition-colors flex items-center gap-2">
              <Wifi className="w-3.5 h-3.5 text-spy-cyan" />
              <span className="spy-text text-[10px] text-white/70">MATRIX: {showMatrix ? "ON" : "OFF"}</span>
            </button>
            <div className="flex items-center gap-2 glass-panel px-3 py-1.5 rounded-full">
              <Database className="w-3.5 h-3.5 text-spy-purple" />
              <span className="spy-text text-[10px] text-white/70">OSINT DATABASE</span>
            </div>
            <div className="flex items-center gap-2 glass-panel px-3 py-1.5 rounded-full">
              <Eye className="w-3.5 h-3.5 text-spy-cyan" />
              <span className="spy-text text-[10px] text-white/70">STEALTH MODE</span>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-20 max-w-7xl mx-auto px-6 py-8">
        <div className="flex justify-center gap-8 mb-8">
          <div className="glass-panel rounded-2xl p-4 flex flex-col items-center">
            <div className="flex items-center gap-2 mb-2">
              <RadarIcon className="w-4 h-4 text-spy-green" />
              <span className="spy-text text-[10px] tracking-widest text-spy-green">SIGNAL DETECTION</span>
            </div>
            <Radar />
          </div>
          <div className="glass-panel rounded-2xl p-4 flex flex-col items-center">
            <div className="flex items-center gap-2 mb-2">
              <Crosshair className="w-4 h-4 text-spy-cyan" />
              <span className="spy-text text-[10px] tracking-widest text-spy-cyan">GLOBAL NETWORK</span>
            </div>
            <GlobeVis />
          </div>
        </div>

        <div className="max-w-3xl mx-auto text-center mb-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="flex items-center justify-center gap-2 mb-4">
              <Target className="w-5 h-5 text-spy-red" />
              <span className="spy-text text-xs tracking-[0.3em] text-spy-red">TARGET ACQUISITION</span>
              <Target className="w-5 h-5 text-spy-red" />
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Hunt Down <span className="text-spy-cyan glow-cyan">Contact Intel</span>
            </h2>
            <p className="text-white/50 text-sm max-w-xl mx-auto leading-relaxed">
              Enter an organization name to scan corporate registries, social networks, and public directories for phone, fax, email, and LinkedIn intelligence.
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="mt-8 relative">
            <div className="glass-panel-luminous rounded-2xl p-1.5 luminous-border">
              <div className="flex gap-1 mb-1.5 px-1">
                {VERTICALS.map((v) => (
                  <button key={v.id} onClick={() => setVertical(v.id)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg spy-text text-[10px] tracking-wider transition-all border ${
                      vertical === v.id ? `${v.color} bg-white/10 border-white/20` : "text-white/40 border-transparent hover:text-white/60 hover:bg-white/5"
                    }`}>
                    <v.icon className="w-3.5 h-3.5" />{v.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 glass-input rounded-xl px-4 py-3">
                <Search className="w-5 h-5 text-spy-cyan/60 flex-shrink-0" />
                <input ref={inputRef} type="text" value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  placeholder="Enter organization name..."
                  className="flex-1 bg-transparent border-none outline-none text-white placeholder-white/30 spy-text text-sm" />
                <button onClick={handleSearch} disabled={isLoading || !query.trim()}
                  className="flex items-center gap-2 bg-spy-cyan/10 hover:bg-spy-cyan/20 text-spy-cyan px-4 py-2 rounded-lg spy-text text-xs tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-spy-cyan/30">
                  <Zap className="w-3.5 h-3.5" />{isLoading ? "SCANNING..." : "ACQUIRE"}
                </button>
              </div>
            </div>
          </motion.div>
        </div>

        <AnimatePresence>
          {isLoading && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="max-w-4xl mx-auto mb-8">
              <div className="glass-panel rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-6">
                  <Activity className="w-5 h-5 text-spy-cyan animate-pulse" />
                  <h3 className="spy-text text-sm tracking-wider text-spy-cyan">SCANNING PROTOCOLS ACTIVE</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                  {["CORP REGISTRY", "DNS SCAN", "LINKEDIN", "DIRECTORY"].map((src, i) => (
                    <div key={src} className="glass-panel rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`w-2 h-2 rounded-full ${logs.length > i * 2 ? "bg-spy-green" : "bg-white/20"}`} />
                        <span className="spy-text text-[10px] text-white/60">{src}</span>
                      </div>
                      <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                        <motion.div className="h-full bg-spy-cyan rounded-full" initial={{ width: 0 }} animate={{ width: logs.length > i * 2 ? "100%" : "0%" }} transition={{ duration: 0.5 }} />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="bg-black/50 rounded-lg p-4 font-mono text-xs space-y-1 max-h-48 overflow-y-auto">
                  {logs.map((log, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className={`${log.includes("ERROR") ? "text-spy-red" : log.includes("ACQUIRED") ? "text-spy-green" : "text-spy-cyan/70"}`}>{log}</motion.div>
                  ))}
                  {isLoading && <div className="text-spy-cyan/50 terminal-cursor">Processing...</div>}
                </div>
              </div>
            </motion.div>
          )}

          {intelligence && intelligence.contacts && (
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="max-w-5xl mx-auto">
              <div className="glass-panel-luminous rounded-2xl p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-6 h-6 text-spy-green" />
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`spy-text text-[10px] tracking-widest px-2 py-0.5 rounded bg-white/10 ${intelligence.vertical === "procurement" ? "text-spy-green" : intelligence.vertical === "provider" ? "text-spy-purple" : intelligence.vertical === "pricing" ? "text-spy-amber" : "text-spy-cyan"}`}>{intelligence.vertical?.toUpperCase() || "CONTACT"}</span>
                      </div>
                      <h3 className="text-xl font-bold text-white">{intelligence.organization}</h3>
                      <p className="text-xs text-white/50 spy-text">{intelligence.contacts.length} contact vectors identified</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="spy-text text-[10px] text-white/40">CONFIDENCE SCORE</div>
                    <div className="text-2xl font-bold text-spy-green spy-text">{intelligence.confidence}%</div>
                  </div>
                </div>
                {intelligence.signals && intelligence.signals.length > 0 && (
                  <div className="mb-4">
                    <div className="spy-text text-[10px] text-white/40 tracking-widest mb-2">INTELLIGENCE SIGNALS</div>
                    <div className="flex flex-wrap gap-2">
                      {intelligence.signals.map((sig, i) => (
                        <span key={i} title={sig.description} className={`spy-text text-[10px] px-2 py-1 rounded-full border ${sig.score > 0 ? "bg-spy-green/10 text-spy-green border-spy-green/30" : "bg-spy-red/10 text-spy-red border-spy-red/30"}`}>{sig.name} {sig.score > 0 ? "+" : ""}{sig.score}</span>
                      ))}
                    </div>
                  </div>
                )}
                {intelligence.note && (
                  <div className="bg-spy-amber/10 border border-spy-amber/30 rounded-lg p-3 mb-4">
                    <p className="text-xs text-spy-amber spy-text">{intelligence.note}</p>
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  {intelligence.sources.map((source) => (
                    <span key={source} className="spy-text text-[10px] px-2 py-1 rounded-full bg-white/5 text-white/50 border border-white/10">{source}</span>
                  ))}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {intelligence.contacts.map((contact, index) => (
                  <motion.div key={contact.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
                    <div className="glass-panel-luminous rounded-xl p-4 luminous-border group hover:bg-white/[0.06] transition-all">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center"><ContactTypeIcon type={contact.type} /></div>
                          <div><div className="text-[10px] uppercase tracking-widest text-white/40">{contact.type}</div><div className="text-sm font-medium text-white">{contact.label}</div></div>
                        </div>
                        <div className="text-right">
                          <div className="text-[10px] text-white/40">Confidence</div>
                          <div className={`text-xs font-bold ${contact.confidence > 90 ? "text-spy-green" : contact.confidence > 70 ? "text-spy-cyan" : "text-spy-amber"}`}>{contact.confidence}%</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <code className="flex-1 text-sm text-white bg-black/30 px-3 py-2 rounded-lg border border-white/10 truncate">{contact.value}</code>
                        <button onClick={() => copyToClipboard(contact.value, contact.id)} className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-white/10 transition-colors border border-white/10">
                          {copiedId === contact.id ? <CheckCircle2 className="w-4 h-4 text-spy-green" /> : <Copy className="w-4 h-4 text-white/50" />}
                        </button>
                        {(contact.type === "linkedin" || contact.type === "website") && (
                          <a href={contact.value} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-white/10 transition-colors border border-white/10">
                            <ExternalLink className="w-4 h-4 text-white/50" />
                          </a>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <ChevronRight className="w-3 h-3 text-white/40" />
                        <span className="text-[10px] text-white/40">{contact.source}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
