/**
 * Simple learning layer: remembers user feedback on results (good/bad)
 * and applies exclusions / boosts on future searches.
 *
 * Persistence: browser localStorage (client) + optional server file via API.
 * Server-side uses an in-memory store seeded from feedback posts.
 */

import type { ContactType, FeedbackEntry } from '../types/search'

const STORAGE_KEY = 'contactfinder_feedback_v1'

// Server-side in-memory store (survives within process lifetime)
const serverStore: FeedbackEntry[] = []

export function getServerFeedback(): FeedbackEntry[] {
  return [...serverStore]
}

export function addServerFeedback(entry: FeedbackEntry): void {
  // Deduplicate by value+org+verdict
  const exists = serverStore.find(
    e => e.value === entry.value && e.organization === entry.organization && e.verdict === entry.verdict
  )
  if (!exists) {
    serverStore.push(entry)
    // Cap size
    if (serverStore.length > 2000) serverStore.shift()
  }
}

/** Build exclusion set from "bad" feedback */
export function getLearnedExclusions(org?: string): Set<string> {
  const set = new Set<string>()
  for (const e of serverStore) {
    if (e.verdict !== 'bad') continue
    if (org && e.organization.toLowerCase() !== org.toLowerCase()) {
      // Global bad values still apply
      set.add(e.value.toLowerCase())
    } else {
      set.add(e.value.toLowerCase())
    }
  }
  return set
}

/** Build boost map from "good" feedback (value -> boost points) */
export function getLearnedBoosts(org?: string): Map<string, number> {
  const map = new Map<string, number>()
  for (const e of serverStore) {
    if (e.verdict !== 'good') continue
    if (org && e.organization.toLowerCase() !== org.toLowerCase()) continue
    const key = e.value.toLowerCase()
    map.set(key, (map.get(key) || 0) + 15)
  }
  return map
}

export function applyLearningFilter<
  T extends { value: string; confidence: number; type: ContactType }
>(contacts: T[], organization: string): T[] {
  const exclusions = getLearnedExclusions(organization)
  const boosts = getLearnedBoosts(organization)

  return contacts
    .filter(c => !exclusions.has(c.value.toLowerCase()))
    .map(c => {
      const boost = boosts.get(c.value.toLowerCase()) || 0
      if (boost === 0) return c
      return { ...c, confidence: Math.min(100, c.confidence + boost) }
    })
}

// ─── Client helpers (for the UI) ───

export function loadClientFeedback(): FeedbackEntry[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as FeedbackEntry[]
  } catch {
    return []
  }
}

export function saveClientFeedback(entries: FeedbackEntry[]): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(-500)))
  } catch {
    // quota
  }
}

export function recordClientFeedback(entry: FeedbackEntry): FeedbackEntry[] {
  const all = loadClientFeedback()
  const filtered = all.filter(
    e => !(e.value === entry.value && e.organization === entry.organization)
  )
  filtered.push(entry)
  saveClientFeedback(filtered)
  return filtered
}
