import type { ContactResult, IntelligenceObject, Signal } from '../types/search'
import { applyLearningFilter } from './learning'

export type Vertical = 'contact'

export function expandQuery(query: string): {
  original: string
  expansions: string[]
} {
  const q = query.trim()
  return {
    original: q,
    expansions: [
      `"${q}" email OR contact OR "@"`,
      `site:linkedin.com/company "${q}"`,
      `"${q}" site:linkedin.com`,
      `${q} LinkedIn company`,
      `"${q}" ("info@" OR "contact@" OR "hello@" OR "sales@")`,
      `${q} leadership team OR "executive team"`,
      `"${q}" (CEO OR founder OR "VP of" OR director)`,
    ],
  }
}

export function scoreSignals(text: string): Signal[] {
  const signals: Signal[] = []
  if (/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(text)) {
    signals.push({ name: 'email detected', score: 30, description: 'Email address found' })
  }
  if (/linkedin\.com\/(?:company|in)\//.test(text)) {
    signals.push({ name: 'LinkedIn profile', score: 35, description: 'LinkedIn presence confirmed' })
  }
  if (/(CEO|CTO|CFO|founder|VP|director|president)/i.test(text)) {
    signals.push({ name: 'leadership signals', score: 20, description: 'Executive titles mentioned' })
  }
  return signals
}

export function calculateConfidence(signals: Signal[], contactCount: number): number {
  if (contactCount === 0) return 0
  const total = signals.reduce((s, x) => s + x.score, 0)
  const bonus = Math.min(contactCount * 8, 35)
  return Math.max(0, Math.min(100, Math.round(total + bonus + 15)))
}

export function buildIntelligenceObject(
  query: string,
  contacts: ContactResult[],
  sources: string[],
  rawTexts: string[],
  note?: string
): IntelligenceObject {
  // Apply learning filter (exclusions + boosts from user feedback)
  const filtered = applyLearningFilter(contacts, query)

  const allSignals: Signal[] = []
  for (const text of rawTexts) {
    for (const s of scoreSignals(text)) {
      if (!allSignals.find(x => x.name === s.name)) allSignals.push(s)
    }
  }

  return {
    organization: query,
    confidence: calculateConfidence(allSignals, filtered.length),
    contacts: filtered,
    signals: allSignals,
    sources: [...new Set(sources)],
    queryExpansions: expandQuery(query).expansions,
    timestamp: new Date().toISOString(),
    note,
  }
}
