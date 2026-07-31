import type { ContactType, FeedbackEntry } from '../types/search'

/** Build exclusion set from persisted "bad" feedback */
export function getLearnedExclusions(entries: FeedbackEntry[], org?: string): Set<string> {
  const set = new Set<string>()
  const normalizedOrg = org?.toLowerCase()

  for (const entry of entries) {
    if (entry.verdict !== 'bad') continue

    const entryOrg = entry.organization.toLowerCase()
    if (!normalizedOrg || entryOrg === normalizedOrg) {
      set.add(entry.value.toLowerCase())
    }
  }

  return set
}

/** Build boost map from persisted "good" feedback (value -> boost points) */
export function getLearnedBoosts(entries: FeedbackEntry[], org?: string): Map<string, number> {
  const map = new Map<string, number>()
  const normalizedOrg = org?.toLowerCase()

  for (const entry of entries) {
    if (entry.verdict !== 'good') continue

    const entryOrg = entry.organization.toLowerCase()
    if (normalizedOrg && entryOrg !== normalizedOrg) continue

    const key = entry.value.toLowerCase()
    map.set(key, (map.get(key) || 0) + 15)
  }

  return map
}

export function applyLearningFilter<
  T extends { value: string; confidence: number; type: ContactType }
>(contacts: T[], organization: string, entries: FeedbackEntry[] = []): T[] {
  const exclusions = getLearnedExclusions(entries, organization)
  const boosts = getLearnedBoosts(entries, organization)

  return contacts
    .filter(contact => !exclusions.has(contact.value.toLowerCase()))
    .map(contact => {
      const boost = boosts.get(contact.value.toLowerCase()) || 0
      if (boost === 0) return contact
      return { ...contact, confidence: Math.min(100, contact.confidence + boost) }
    })
}
