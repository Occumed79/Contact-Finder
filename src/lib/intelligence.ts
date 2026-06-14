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
    description: 'Hunt phone, email, fax, LinkedIn, and web presence',
    keywords: ['contact', 'phone', 'email', 'fax', 'reach', 'call', 'directory'],
    synonymMap: {
      company: ['corporation', 'inc', 'llc', 'organization', 'enterprise', 'firm', 'agency'],
      contact: ['phone', 'email', 'fax', 'address', 'reach', 'connect'],
      phone: ['telephone', 'direct line', 'main line', 'toll free', 'mobile', 'office'],
      email: ['e-mail', 'contact email', 'support email', 'inquiries', 'info'],
      linkedin: ['linked in', 'professional profile', 'company page'],
    },
    expansions: (q) => [
      `${q} contact phone email`,
      `${q} phone number`,
      `${q} email address`,
      `${q} LinkedIn`,
      `${q} fax number`,
      `${q} headquarters address`,
      `${q} corporate office`,
      `${q} customer service`,
    ],
    siteOperators: [],
    scoringRules: [
      { pattern: /contact|phone|email/i, score: 25, name: 'contact keywords' },
      { pattern: /headquarters|corporate office|main office/i, score: 20, name: 'corporate presence' },
      { pattern: /linkedin\.com\/company/i, score: 35, name: 'LinkedIn company page' },
      { pattern: /\+?1\s*\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/, score: 30, name: 'phone number found' },
      { pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/, score: 25, name: 'email found' },
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
    contact: 0,
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

  // Special weighting
  if (/\b(rfp|rfq|tender|solicitation|procurement|bid)\b/i.test(q)) scores.procurement += 5
  if (/\b(clinic|physician|doctor|provider|medical)\b/i.test(q)) scores.provider += 5
  if (/\b(price|cost|fee|rate|pricing|schedule)\b/i.test(q)) scores.pricing += 5
  if (/\b(contact|phone|email|fax)\b/i.test(q)) scores.contact += 3

  let best: Vertical = 'general'
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

  // Build synonym map for this specific query
  const synonyms: Record<string, string[]> = {}
  for (const [key, variants] of Object.entries(config.synonymMap)) {
    if (query.toLowerCase().includes(key.toLowerCase())) {
      synonyms[key] = variants
    }
  }

  // Generate expansions
  const expansions = config.expansions(query)

  // Inject site operators into a subset of expansions
  const withOperators: string[] = []
  if (config.siteOperators.length > 0) {
    for (const op of config.siteOperators) {
      withOperators.push(`${op} "${query}"`)
    }
  }

  // Add synonym-swapped variants
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
  const allText = `${text} ${url || ''}`.toLowerCase()

  // Domain authority signals
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

  // Content signals
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

  // Contact signals
  if (/\+?1\s*\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/.test(text)) {
    signals.push({ name: 'phone detected', score: 25, description: 'Telephone number found in content' })
  }
  if (/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(text)) {
    signals.push({ name: 'email detected', score: 25, description: 'Email address found in content' })
  }
  if (/linkedin\.com\/(?:company|in)\//.test(text)) {
    signals.push({ name: 'LinkedIn profile', score: 30, description: 'LinkedIn presence confirmed' })
  }

  // Negative signals
  if (/spam|scam|fake|unverified/i.test(text)) {
    signals.push({ name: 'suspicious content', score: -40, description: 'Potential spam or fraud indicators' })
  }
  if (/archive\.org|wayback|cached/i.test(url || '')) {
    signals.push({ name: 'archived page', score: -15, description: 'Potentially outdated content' })
  }

  return signals
}

export function calculateConfidence(signals: Signal[], baseContacts: number): number {
  const totalScore = signals.reduce((sum, s) => sum + s.score, 0)
  const contactBonus = Math.min(baseContacts * 5, 25)
  const raw = Math.min(totalScore + contactBonus + 40, 100)
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

  // Score each raw text snippet
  for (const text of rawTexts) {
    const sigs = scoreSignals(text)
    for (const s of sigs) {
      // deduplicate by name
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

// ─── MOCK INTELLIGENCE OBJECTS BY VERTICAL ───

export function generateMockIntelligence(query: string, vertical: Vertical): IntelligenceObject {
  const slug = query.toLowerCase().replace(/\s+/g, '-')
  const areaCode = 200 + Math.floor(Math.random() * 800)
  const prefix = 300 + Math.floor(Math.random() * 700)
  const line = 1000 + Math.floor(Math.random() * 9000)

  const baseContacts: IntelligenceObject['contacts'] = [
    {
      id: '1',
      type: 'phone',
      value: `+1 (${areaCode}) ${prefix}-${line}`,
      label: 'Main Office',
      source: 'Corporate Registry',
      confidence: 92,
    },
    {
      id: '2',
      type: 'email',
      value: `info@${slug}.com`,
      label: 'General Inquiries',
      source: 'Website Crawl',
      confidence: 88,
    },
    {
      id: '3',
      type: 'website',
      value: `https://www.${slug}.com`,
      label: 'Official Website',
      source: 'DNS Lookup',
      confidence: 96,
    },
    {
      id: '4',
      type: 'linkedin',
      value: `https://linkedin.com/company/${slug}`,
      label: 'Company Profile',
      source: 'LinkedIn API',
      confidence: 95,
    },
  ]

  if (vertical === 'procurement') {
    baseContacts.push({
      id: '5',
      type: 'email',
      value: `procurement@${slug}.com`,
      label: 'Procurement Office',
      source: 'Government Portal',
      confidence: 78,
    })
  }

  const signals = scoreSignals(`${query} ${vertical} contact info`)

  return {
    organization: query,
    vertical,
    confidence: calculateConfidence(signals, baseContacts.length),
    contacts: baseContacts,
    signals,
    sources: ['Corporate Registry', 'LinkedIn API', 'WHOIS Database', 'Public Directory', 'Website Crawl'],
    queryExpansions: VERTICAL_CONFIGS[vertical].expansions(query),
    timestamp: new Date().toISOString(),
    note: 'Demonstration data. Live scraping unavailable.',
  }
}

export { VERTICAL_CONFIGS }
