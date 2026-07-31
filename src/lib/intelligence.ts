export type Vertical = 'contact' | 'procurement' | 'provider' | 'pricing' | 'general'

export interface Signal {
  name: string
  score: number
  description: string
}

export interface IntelligenceObject {
  organization: string
  vertical: Vertical
  confidence: number
  contacts: Array<{
    id: string
    type: 'phone' | 'email' | 'fax' | 'linkedin' | 'website'
    value: string
    label: string
    source: string
    confidence: number
  }>
  signals: Signal[]
  sources: string[]
  queryExpansions: string[]
  timestamp: string
  note?: string
}

// ─── VERTICAL CONFIGURATION ───

interface VerticalConfig {
  label: string
  description: string
  keywords: string[]
  synonymMap: Record<string, string[]>
  expansions: (query: string) => string[]
  siteOperators: string[]
  scoringRules: Array<{
    pattern: RegExp
    score: number
    name: string
  }>
}

const VERTICAL_CONFIGS: Record<Vertical, VerticalConfig> = {
  contact: {
    label: 'CONTACT INTEL',
    description: 'Find LinkedIn company pages and real email addresses',
    keywords: ['contact', 'phone', 'email', 'fax', 'reach', 'call', 'directory', 'linkedin'],
    synonymMap: {
      company: ['corporation', 'inc', 'llc', 'organization', 'enterprise', 'firm', 'agency'],
      contact: ['phone', 'email', 'fax', 'address', 'reach', 'connect'],
      email: ['e-mail', 'contact email', 'support email', 'inquiries', 'info'],
      linkedin: ['linked in', 'professional profile', 'company page'],
    },
    expansions: (q) => [
      `"${q}" email OR contact OR "@"`,
      `"${q}" "email" OR "e-mail" OR "contact us"`,
      `site:linkedin.com/company "${q}"`,
      `"${q}" site:linkedin.com`,
      `${q} LinkedIn company`,
      `"${q}" ("info@" OR "contact@" OR "hello@" OR "sales@")`,
      `${q} official website contact`,
    ],
    siteOperators: ['site:linkedin.com/company'],
    scoringRules: [
      { pattern: /linkedin\.com\/company/i, score: 40, name: 'LinkedIn company page' },
      { pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/, score: 30, name: 'email found' },
      { pattern: /contact|email|linkedin/i, score: 15, name: 'contact keywords' },
    ],
  },

  procurement: {
    label: 'PROCUREMENT INTEL',
    description: 'Find RFPs, bids, solicitations, and government contracts',
    keywords: ['RFP', 'bid', 'solicitation', 'procurement', 'tender', 'contract', 'proposal', 'solicitation'],
    synonymMap: {
      RFP: ['request for proposal', 'solicitation', 'bid', 'tender', 'procurement', 'RFQ', 'RFT'],
      'occupational health': ['occupational medicine', 'worksite clinic', 'employee health', 'industrial medicine', 'pre-employment'],
      services: ['contract', 'agreement', 'engagement', 'arrangement'],
    },
    expansions: (q) => [
      `${q} RFP`,
      `${q} solicitation`,
      `${q} bid`,
      `${q} procurement`,
      `${q} contract opportunity`,
      `site:.gov ${q}`,
      `site:sam.gov ${q}`,
      `filetype:pdf ${q}`,
      `${q} due date`,
      `${q} proposal`,
    ],
    siteOperators: ['site:.gov', 'site:sam.gov', 'site:bonfirehub.com', 'site:planetbids.com'],
    scoringRules: [
      { pattern: /\.gov\b/i, score: 35, name: '.gov domain' },
      { pattern: /RFP|solicitation|bid|tender|procurement/i, score: 40, name: 'procurement language' },
      { pattern: /due date|deadline|closing date/i, score: 20, name: 'includes deadline' },
      { pattern: /filetype:pdf|\.pdf/i, score: 40, name: 'PDF document' },
      { pattern: /\$[\d,]+(?:\.\d{2})?|\$\d+ million|\$\d+K/i, score: 15, name: 'monetary value' },
      { pattern: /SAM\.gov|bonfire|planetbids|ionwave|bidnet/i, score: 30, name: 'procurement portal' },
    ],
  },

  provider: {
    label: 'PROVIDER INTEL',
    description: 'Discover clinics, physicians, and healthcare providers',
    keywords: ['clinic', 'provider', 'doctor', 'physician', 'healthcare', 'medical', 'practice'],
    synonymMap: {
      clinic: ['medical center', 'health center', 'practice', 'facility', 'office'],
      provider: ['doctor', 'physician', 'practitioner', 'specialist', 'clinician'],
      occupational: ['worksite', 'industrial', 'employee', 'corporate'],
    },
    expansions: (q) => [
      `${q} clinic`,
      `${q} provider directory`,
      `${q} medical practice`,
      `${q} healthcare provider`,
      `${q} physician`,
      `${q} services offered`,
      `${q} locations`,
    ],
    siteOperators: [],
    scoringRules: [
      { pattern: /clinic|medical center|health center|practice/i, score: 30, name: 'provider entity' },
      { pattern: /physician|doctor|provider|clinician/i, score: 25, name: 'provider keywords' },
      { pattern: /board certified|licensed|accredited/i, score: 20, name: 'credentials' },
      { pattern: /location|address|suite|floor/i, score: 15, name: 'physical address' },
    ],
  },

  pricing: {
    label: 'PRICING INTEL',
    description: 'Extract fee schedules, rates, and cost structures',
    keywords: ['price', 'cost', 'fee', 'rate', 'schedule', 'pricing', 'charge'],
    synonymMap: {
      pricing: ['fee schedule', 'cost', 'rates', 'charges', 'fees', 'price list', 'rate card'],
      PDF: ['document', 'fee schedule', 'price list', 'rate sheet'],
      occupational: ['worksite', 'industrial', 'employee', 'corporate'],
    },
    expansions: (q) => [
      `${q} fee schedule`,
      `${q} pricing`,
      `filetype:pdf ${q}`,
      `${q} cost`,
      `${q} rates`,
      `${q} price list`,
      `${q} fee structure`,
      `${q} self-pay pricing`,
    ],
    siteOperators: ['filetype:pdf'],
    scoringRules: [
      { pattern: /fee schedule|price list|rate card|fee structure/i, score: 40, name: 'pricing document' },
      { pattern: /filetype:pdf|\.pdf/i, score: 40, name: 'PDF document' },
      { pattern: /\$[\d,]+(?:\.\d{2})?|\$\d+\s*(million|k|K)?/i, score: 25, name: 'price values' },
      { pattern: /self-pay|cash price|out-of-pocket/i, score: 20, name: 'self-pay mention' },
    ],
  },

  general: {
    label: 'GENERAL INTEL',
    description: 'Broad-spectrum search across all vectors',
    keywords: [],
    synonymMap: {},
    expansions: (q) => [
      `${q} contact`,
      `${q} information`,
      `${q} about`,
      `${q} services`,
    ],
    siteOperators: [],
    scoringRules: [
      { pattern: /contact|about|information/i, score: 10, name: 'general info' },
    ],
  },
}

// ─── CLASSIFY VERTICAL ───

export function classifyVertical(query: string): Vertical {
  const q = query.toLowerCase()
  const scores: Record<Vertical, number> = {
    contact: 2, // default lean toward contact finder
    procurement: 0,
    provider: 0,
    pricing: 0,
    general: 1,
  }

  for (const [vertical, config] of Object.entries(VERTICAL_CONFIGS)) {
    if (vertical === 'general') continue
    for (const kw of config.keywords) {
      if (q.includes(kw.toLowerCase())) {
        scores[vertical as Vertical] += 2
      }
    }
  }

  if (/\b(rfp|rfq|tender|solicitation|procurement|bid)\b/i.test(q)) scores.procurement += 5
  if (/\b(clinic|physician|doctor|provider|medical)\b/i.test(q)) scores.provider += 5
  if (/\b(price|cost|fee|rate|pricing|schedule)\b/i.test(q)) scores.pricing += 5
  if (/\b(contact|phone|email|fax|linkedin)\b/i.test(q)) scores.contact += 3

  let best: Vertical = 'contact'
  let bestScore = 0
  for (const [v, s] of Object.entries(scores)) {
    if (s > bestScore) {
      bestScore = s
      best = v as Vertical
    }
  }

  return best
}

// ─── QUERY EXPANSION ───

export interface ExpandedQuery {
  original: string
  vertical: Vertical
  expansions: string[]
  withOperators: string[]
  synonyms: Record<string, string[]>
}

export function expandQuery(query: string, forcedVertical?: Vertical): ExpandedQuery {
  const vertical = forcedVertical || classifyVertical(query)
  const config = VERTICAL_CONFIGS[vertical]

  const synonyms: Record<string, string[]> = {}
  for (const [key, variants] of Object.entries(config.synonymMap)) {
    if (query.toLowerCase().includes(key.toLowerCase())) {
      synonyms[key] = variants
    }
  }

  const expansions = config.expansions(query)

  const withOperators: string[] = []
  if (config.siteOperators.length > 0) {
    for (const op of config.siteOperators) {
      withOperators.push(`${op} "${query}"`)
    }
  }

  const synonymVariants: string[] = []
  for (const [key, variants] of Object.entries(synonyms)) {
    for (const variant of variants) {
      const swapped = query.replace(new RegExp(key, 'gi'), variant)
      if (swapped !== query) {
        synonymVariants.push(swapped)
      }
    }
  }

  return {
    original: query,
    vertical,
    expansions: [...new Set([...expansions, ...synonymVariants])],
    withOperators: [...new Set(withOperators)],
    synonyms,
  }
}

// ─── SIGNAL SCORING ───

export function scoreSignals(text: string, url?: string): Signal[] {
  const signals: Signal[] = []

  if (/\.gov\b/.test(url || '')) {
    signals.push({ name: '.gov domain', score: 35, description: 'Government domain = high authority' })
  }
  if (/\.edu\b/.test(url || '')) {
    signals.push({ name: '.edu domain', score: 30, description: 'Educational institution' })
  }
  if (/\.org\b/.test(url || '')) {
    signals.push({ name: '.org domain', score: 15, description: 'Non-profit organization' })
  }
  if (/linkedin\.com/.test(url || '')) {
    signals.push({ name: 'LinkedIn source', score: 35, description: 'Professional network verified' })
  }

  if (/RFP|request for proposal|solicitation|bid|tender|procurement/i.test(text)) {
    signals.push({ name: 'procurement language', score: 40, description: 'Contains procurement terminology' })
  }
  if (/fee schedule|price list|rate card|pricing/i.test(text)) {
    signals.push({ name: 'pricing document', score: 40, description: 'Explicit pricing terminology' })
  }
  if (/due date|deadline|closing date|submission date/i.test(text)) {
    signals.push({ name: 'time-sensitive', score: 20, description: 'Includes deadline information' })
  }
  if (/\$[\d,]+(?:\.\d{2})?/i.test(text)) {
    signals.push({ name: 'monetary values', score: 15, description: 'Contains dollar amounts' })
  }
  if (/board certified|licensed|accredited/i.test(text)) {
    signals.push({ name: 'credentials', score: 20, description: 'Professional credentials mentioned' })
  }

  if (/\+?1\s*\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/.test(text)) {
    signals.push({ name: 'phone detected', score: 15, description: 'Telephone number found in content' })
  }
  if (/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(text)) {
    signals.push({ name: 'email detected', score: 30, description: 'Email address found in content' })
  }
  if (/linkedin\.com\/(?:company|in)\//.test(text)) {
    signals.push({ name: 'LinkedIn profile', score: 35, description: 'LinkedIn presence confirmed' })
  }

  if (/spam|scam|fake|unverified/i.test(text)) {
    signals.push({ name: 'suspicious content', score: -40, description: 'Potential spam or fraud indicators' })
  }
  if (/archive\.org|wayback|cached/i.test(url || '')) {
    signals.push({ name: 'archived page', score: -15, description: 'Potentially outdated content' })
  }

  return signals
}

export function calculateConfidence(signals: Signal[], baseContacts: number): number {
  if (baseContacts === 0) return 0
  const totalScore = signals.reduce((sum, s) => sum + s.score, 0)
  const contactBonus = Math.min(baseContacts * 8, 35)
  const raw = Math.min(totalScore + contactBonus + 20, 100)
  return Math.max(0, Math.round(raw))
}

// ─── INTELLIGENCE OBJECT BUILDER ───

export function buildIntelligenceObject(
  query: string,
  expanded: ExpandedQuery,
  contacts: IntelligenceObject['contacts'],
  rawSources: string[],
  rawTexts: string[],
  note?: string
): IntelligenceObject {
  const allSignals: Signal[] = []

  for (const text of rawTexts) {
    const sigs = scoreSignals(text)
    for (const s of sigs) {
      if (!allSignals.find((x) => x.name === s.name)) {
        allSignals.push(s)
      }
    }
  }

  const confidence = calculateConfidence(allSignals, contacts.length)

  return {
    organization: query,
    vertical: expanded.vertical,
    confidence,
    contacts,
    signals: allSignals,
    sources: [...new Set(rawSources)],
    queryExpansions: expanded.expansions,
    timestamp: new Date().toISOString(),
    note,
  }
}

/**
 * Minimal demo-only mock. Never used as a silent replacement for failed real searches.
 * Returns a clearly labeled example so the UI can still render structure.
 */
export function generateMockIntelligence(query: string, vertical: Vertical): IntelligenceObject {
  const slug = query.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'example'
  const domainSlug = query.toLowerCase().replace(/[^a-z0-9]+/g, '') || 'example'

  return {
    organization: query,
    vertical,
    confidence: 0,
    contacts: [
      {
        id: '1',
        type: 'email',
        value: `info@${domainSlug}.com`,
        label: 'Example only (not real)',
        source: 'Demo',
        confidence: 5,
      },
      {
        id: '2',
        type: 'linkedin',
        value: `https://www.linkedin.com/company/${slug}`,
        label: 'Example only (not real)',
        source: 'Demo',
        confidence: 5,
      },
    ],
    signals: [],
    sources: ['Demo'],
    queryExpansions: VERTICAL_CONFIGS[vertical].expansions(query),
    timestamp: new Date().toISOString(),
    note: 'No real LinkedIn or email contacts were found. Showing labeled demo placeholders only — these are not real contact data.',
  }
}

export { VERTICAL_CONFIGS }
