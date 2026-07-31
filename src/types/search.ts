export type ResultLens = "email" | "linkedin" | "employee";

export type ContactType = "email" | "linkedin" | "employee";

export interface ContactResult {
  id: string;
  type: ContactType;
  value: string;
  label: string;
  source: string;
  confidence: number;
  /** For employee lens: job title / position */
  title?: string;
  /** For employee lens: LinkedIn profile URL if known */
  linkedinUrl?: string;
}

export interface Signal {
  name: string;
  score: number;
  description: string;
}

export interface IntelligenceObject {
  organization: string;
  confidence: number;
  contacts: ContactResult[];
  signals: Signal[];
  sources: string[];
  queryExpansions: string[];
  timestamp: string;
  note?: string;
  methodBreakdown?: Record<string, { success: boolean; sources: string[] }>;
  totalMethodsAttempted?: number;
  successfulMethods?: number;
}

export interface SearchSuggestion {
  text: string;
  type: "trending" | "related" | "history" | "ai";
  score: number;
}

/** Feedback for learning good vs bad results */
export interface FeedbackEntry {
  value: string;
  type: ContactType;
  organization: string;
  verdict: "good" | "bad";
  timestamp: string;
}

// Legacy alias kept so older imports don't break during transition
export type Vertical = "contact";
