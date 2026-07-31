import * as cheerio from 'cheerio'
import {
  type IntelligenceObject,
  type ExpandedQuery,
  type Vertical,
  expandQuery,
  scoreSignals,
  calculateConfidence,
  buildIntelligenceObject,
  generateMockIntelligence,
  VERTICAL_CONFIGS,
} from './intelligence'

export interface ContactResult {
  id: string
  type: 'phone' | 'email' | 'fax' | 'linkedin' | 'website'
  value: string
  label: string
  source: string
  confidence: number
}

export interface SearchResult {
  organization: string
  status: 'idle' | 'scanning' | 'found' | 'error'
  contacts: ContactResult[]
  sources: string[]
  timestamp: string
}

// Re-export intelligence types for consumers
export type { IntelligenceObject, ExpandedQuery, Vertical }

// ─── JUNK FILTERS ───

const JUNK_EMAIL_LOCAL = new Set([
  'noreply', 'no-reply', 'donotreply', 'do-not-reply', 'mailer-daemon',
  'postmaster', 'webmaster', 'hostmaster', 'abuse', 'spam', 'privacy',
  'newsletter', 'marketing', 'unsubscribe', 'bounce', 'daemon',
  'support+noreply', 'notifications', 'alert', 'alerts', 'system',
  'root', 'admin+', 'test', 'example', 'demo', 'sample', 'user',
  'info+', 'contact+', 'hello+', 'hi+', 'mail+',
])

const JUNK_EMAIL_DOMAINS = new Set([
  'example.com', 'example.org', 'example.net', 'test.com', 'test.org',
  'localhost', 'domain.com', 'email.com', 'yourdomain.com', 'company.com',
  'sentry.io', 'wixpress.com', 'squarespace.com', 'godaddy.com',
  'cloudflare.com', 'googleusercontent.com', 'gstatic.com',
  'schema.org', 'w3.org', 'jquery.com', 'github.com', 'githubusercontent.com',
  'linkedin.com', 'facebook.com', 'twitter.com', 'x.com', 'instagram.com',
  'youtube.com', 'google.com', 'bing.com', 'duckduckgo.com',
  'mailchimp.com', 'sendgrid.net', 'mandrillapp.com', 'amazonaws.com',
  'gravatar.com', 'wordpress.com', 'blogger.com', 'medium.com',
])

const IMAGE_EXTENSIONS = /\.(png|jpe?g|gif|svg|webp|ico|bmp|tiff?)(\?|$)/i
const TRACKING_PATTERNS = /utm_|pixel|tracker|beacon|analytics|doubleclick|googlesyndication/i

function isJunkEmail(email: string): boolean {
  const lower = email.toLowerCase().trim()
  if (IMAGE_EXTENSIONS.test(lower)) return true
  if (TRACKING_PATTERNS.test(lower)) return true

  const at = lower.lastIndexOf('@')
  if (at < 1) return true
  const local = lower.slice(0, at)
  const domain = lower.slice(at + 1)

  if (local.length < 2 || domain.length < 4) return true
  if (JUNK_EMAIL_LOCAL.has(local)) return true
  if (JUNK_EMAIL_DOMAINS.has(domain)) return true
  if (domain.endsWith('.png') || domain.endsWith('.jpg') || domain.endsWith('.gif')) return true
  // Reject emails that look like file paths or query strings
  if (local.includes('/') || local.includes('?') || domain.includes('/')) return true
  // Very long random-looking local parts (tracking IDs)
  if (local.length > 40 && !/[._-]/.test(local)) return true
  return false
}

function normalizeDomainHint(query: string): string[] {
  // Derive possible domain tokens from organization name
  const cleaned = query
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  const parts = cleaned.split(' ').filter(p => p.length > 2)
  const joined = parts.join('')
  const hyphen = parts.join('-')
  return [...new Set([joined, hyphen, ...parts].filter(Boolean))]
}

function emailMatchesQuery(email: string, query: string): boolean {
  const domain = email.toLowerCase().split('@')[1] || ''
  const hints = normalizeDomainHint(query)
  if (hints.some(h => domain.includes(h) || h.includes(domain.split('.')[0]))) {
    return true
  }
  // Also accept if local part or domain shares a significant token with query
  const qTokens = query.toLowerCase().split(/\W+/).filter(t => t.length > 3)
  return qTokens.some(t => domain.includes(t) || email.toLowerCase().includes(t))
}

export function extractEmails(text: string, query?: string): string[] {
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
  const raw = [...text.matchAll(emailRegex)].map(m => m[0].toLowerCase())
  const unique = [...new Set(raw)].filter(e => !isJunkEmail(e))

  if (!query || unique.length === 0) return unique

  // Prefer emails related to the query organization; keep a few high-quality generics as fallback
  const relevant = unique.filter(e => emailMatchesQuery(e, query))
  if (relevant.length > 0) return relevant

  // Soft fallback: keep non-junk but limit quantity and prefer common contact locals
  const preferredLocals = ['info', 'contact', 'hello', 'sales', 'support', 'hr', 'careers', 'press', 'admin']
  const soft = unique
    .filter(e => preferredLocals.some(p => e.startsWith(p + '@')))
    .slice(0, 5)
  return soft.length > 0 ? soft : unique.slice(0, 3)
}

export function extractPhones(text: string): string[] {
  const phoneRegex = /(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g
  const matches = [...text.matchAll(phoneRegex)].map(m => m[0].trim())
  // Deduplicate and drop obviously invalid (all same digit, too short after digits)
  const seen = new Set<string>()
  const out: string[] = []
  for (const p of matches) {
    const digits = p.replace(/\D/g, '')
    if (digits.length < 10 || digits.length > 11) continue
    if (/^(\d)\1+$/.test(digits)) continue // 0000000000 etc
    const key = digits.slice(-10)
    if (seen.has(key)) continue
    seen.add(key)
    out.push(p)
  }
  return out
}

export function extractLinkedIn(text: string, query?: string): string[] {
  // Capture company and people profiles; normalize to https://www.linkedin.com/...
  const linkedinRegex = /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/(company|in|school)\/[a-zA-Z0-9_-]+\/?/gi
  const matches = [...text.matchAll(linkedinRegex)].map(m => {
    let url = m[0].toLowerCase().replace(/\/$/, '')
    if (!url.startsWith('http')) url = 'https://www.' + url.replace(/^www\./, '')
    else if (!url.includes('www.')) url = url.replace('linkedin.com', 'www.linkedin.com')
    return url
  })

  const unique = [...new Set(matches)].filter(u => {
    // Drop pure search/share junk
    if (u.includes('/share') || u.includes('/feed') || u.includes('/login')) return false
    return true
  })

  if (!query || unique.length === 0) {
    // Prefer company pages
    const companies = unique.filter(u => u.includes('/company/'))
    return companies.length > 0 ? companies : unique.slice(0, 5)
  }

  const hints = normalizeDomainHint(query)
  const scored = unique.map(url => {
    let score = 0
    if (url.includes('/company/')) score += 50
    if (url.includes('/school/')) score += 30
    if (url.includes('/in/')) score += 10
    const slug = url.split('/').pop() || ''
    if (hints.some(h => slug.includes(h) || h.includes(slug))) score += 40
    const qTokens = query.toLowerCase().split(/\W+/).filter(t => t.length > 2)
    if (qTokens.some(t => slug.includes(t))) score += 25
    return { url, score }
  })

  scored.sort((a, b) => b.score - a.score)
  // Keep top relevant; always prefer at least one company page if present
  const top = scored.filter(s => s.score >= 40).map(s => s.url)
  if (top.length > 0) return [...new Set(top)].slice(0, 8)
  return scored.slice(0, 3).map(s => s.url)
}

export function extractWebsites(text: string, domainHint?: string): string[] {
  const urlRegex = /https?:\/\/(?:www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\/[a-zA-Z0-9-._~:/?#[\]@!$&'()*+,;=]*)?/g
  const blocked = [
    'google.com', 'bing.com', 'duckduckgo.com', 'linkedin.com', 'facebook.com',
    'twitter.com', 'x.com', 'youtube.com', 'instagram.com', 'wikipedia.org',
    'crunchbase.com', 'bloomberg.com', 'reuters.com', 'yahoo.com',
  ]
  const urls = [...text.matchAll(urlRegex)]
    .map(m => m[0].replace(/[.,;:!?)]+$/, ''))
    .filter((v, i, a) => a.indexOf(v) === i)
    .filter(u => {
      try {
        const host = new URL(u).hostname.replace(/^www\./, '')
        return !blocked.some(b => host === b || host.endsWith('.' + b))
      } catch {
        return false
      }
    })

  if (domainHint) {
    const filtered = urls.filter(u => u.toLowerCase().includes(domainHint.toLowerCase()))
    return filtered.length > 0 ? filtered : urls.slice(0, 3)
  }
  return urls.slice(0, 5)
}

export function extractFax(text: string): string[] {
  const faxRegex = /fax[:\s]+(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/gi
  const matches = [...text.matchAll(faxRegex)].map(m => {
    const phoneMatch = m[0].match(/(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/)
    return phoneMatch ? phoneMatch[0] : null
  }).filter(Boolean) as string[]
  return [...new Set(matches)]
}

// --- Scraping-based search (no API keys) ---

const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

async function fetchWithTimeout(url: string, timeout = 8000): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeout)
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
      },
      signal: controller.signal,
    })
    clearTimeout(timer)
    return res
  } catch {
    clearTimeout(timer)
    throw new Error(`Fetch timeout for ${url}`)
  }
}

export async function searchDuckDuckGo(query: string): Promise<string> {
  const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`
  const res = await fetchWithTimeout(searchUrl)
  if (!res.ok) throw new Error(`DuckDuckGo error: ${res.status}`)

  const html = await res.text()
  const $ = cheerio.load(html)

  const snippets: string[] = []
  $('.result__snippet').each((_, el) => {
    snippets.push($(el).text())
  })
  $('.result__a').each((_, el) => {
    snippets.push($(el).text())
    snippets.push($(el).attr('href') || '')
  })

  return snippets.join(' ')
}

export async function searchBingHTML(query: string): Promise<string> {
  const searchUrl = `https://www.bing.com/search?q=${encodeURIComponent(query)}&count=20`
  const res = await fetchWithTimeout(searchUrl)
  if (!res.ok) throw new Error(`Bing error: ${res.status}`)

  const html = await res.text()
  const $ = cheerio.load(html)

  const snippets: string[] = []
  $('.b_caption p, .b_algo p, li.b_algo .b_paractl').each((_, el) => {
    snippets.push($(el).text())
  })
  $('li.b_algo h2 a').each((_, el) => {
    snippets.push($(el).attr('href') || '')
    snippets.push($(el).text())
  })

  return snippets.join(' ')
}

export async function searchGoogleScrape(query: string): Promise<string> {
  const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}&num=10&hl=en`
  const res = await fetchWithTimeout(searchUrl)
  if (!res.ok) throw new Error(`Google error: ${res.status}`)

  const html = await res.text()
  const $ = cheerio.load(html)

  const snippets: string[] = []
  $('div[data-sokoban-container] span, .VwiC3b, .s3v94d, .g span, .g .VwiC3b').each((_, el) => {
    snippets.push($(el).text())
  })
  $('a[href^="/url"]').each((_, el) => {
    snippets.push($(el).text())
  })

  return snippets.join(' ')
}

export async function scrapeWebsiteForContacts(url: string): Promise<string> {
  try {
    const res = await fetchWithTimeout(url, 5000)
    if (!res.ok) return ''
    const html = await res.text()
    const $ = cheerio.load(html)
    // Remove script/style for cleaner text
    $('script, style, nav, header, footer').remove()
    return $('body').text().replace(/\s+/g, ' ')
  } catch {
    return ''
  }
}

/** Contact-focused search queries only — LinkedIn + email hunting */
export function buildContactQueries(org: string): string[] {
  const q = org.trim()
  return [
    `"${q}" email OR contact OR "@"`,
    `"${q}" "email" OR "e-mail" OR "contact us"`,
    `site:linkedin.com/company "${q}"`,
    `"${q}" site:linkedin.com`,
    `${q} LinkedIn company`,
    `"${q}" ("info@" OR "contact@" OR "hello@" OR "sales@")`,
    `${q} official website contact`,
  ]
}

export async function searchAllEngines(
  queries: string[]
): Promise<{ text: string; sources: string[]; rawTexts: string[] }> {
  const results: string[] = []
  const sources: string[] = []
  const rawTexts: string[] = []

  const engines = [
    { name: 'DuckDuckGo', fn: searchDuckDuckGo },
    { name: 'Bing', fn: searchBingHTML },
    { name: 'Google', fn: searchGoogleScrape },
  ]

  // Limit concurrent-style sequential to avoid rate limits; prioritize first few queries
  const limitedQueries = queries.slice(0, 5)

  for (const query of limitedQueries) {
    for (const engine of engines) {
      try {
        const text = await engine.fn(query)
        if (text.trim().length > 50) {
          results.push(text)
          rawTexts.push(text)
          sources.push(`${engine.name} (${query.slice(0, 50)})`)
        }
      } catch (err) {
        console.warn(`${engine.name} failed for "${query}":`, err)
      }
    }
  }

  // Also try scraping the top website found
  const allText = results.join(' ')
  const foundUrls = extractWebsites(allText)
  if (foundUrls.length > 0) {
    try {
      const siteText = await scrapeWebsiteForContacts(foundUrls[0])
      if (siteText.length > 100) {
        results.push(siteText)
        rawTexts.push(siteText)
        sources.push(`Direct: ${new URL(foundUrls[0]).hostname}`)
      }
    } catch {
      // ignore
    }
  }

  return { text: results.join(' '), sources, rawTexts }
}

function buildContactsFromText(text: string, sources: string[], query?: string): ContactResult[] {
  const contacts: ContactResult[] = []
  let id = 1

  const emails = extractEmails(text, query)
  const phones = extractPhones(text)
  const linkedins = extractLinkedIn(text, query)
  const websites = extractWebsites(text)
  const faxes = extractFax(text)

  emails.forEach((email, i) => {
    const relevant = query ? emailMatchesQuery(email, query) : true
    contacts.push({
      id: String(id++),
      type: 'email',
      value: email,
      label: i === 0 ? 'Primary Email' : `Email ${i + 1}`,
      source: sources[0] || 'Web Search',
      confidence: Math.max(40, (relevant ? 88 : 55) - i * 6),
    })
  })

  // For contact-finder focus: keep phones/fax/website only if few emails/LinkedIns found
  const coreCount = emails.length + linkedins.length
  if (coreCount < 4) {
    phones.slice(0, 4).forEach((phone, i) => {
      contacts.push({
        id: String(id++),
        type: 'phone',
        value: phone,
        label: i === 0 ? 'Main Phone' : `Phone ${i + 1}`,
        source: sources[0] || 'Web Search',
        confidence: Math.max(40, 75 - i * 8),
      })
    })
    faxes.slice(0, 2).forEach((fax, i) => {
      contacts.push({
        id: String(id++),
        type: 'fax',
        value: fax,
        label: i === 0 ? 'Fax Line' : `Fax ${i + 1}`,
        source: sources[0] || 'Web Search',
        confidence: Math.max(35, 60 - i * 8),
      })
    })
  }

  linkedins.forEach((url, i) => {
    const isCompany = url.includes('/company/')
    contacts.push({
      id: String(id++),
      type: 'linkedin',
      value: url,
      label: isCompany ? 'LinkedIn Company' : i === 0 ? 'LinkedIn Profile' : `LinkedIn ${i + 1}`,
      source: 'LinkedIn Search',
      confidence: Math.max(50, (isCompany ? 94 : 78) - i * 5),
    })
  })

  websites.slice(0, 3).forEach((url, i) => {
    contacts.push({
      id: String(id++),
      type: 'website',
      value: url,
      label: i === 0 ? 'Official Website' : `Website ${i + 1}`,
      source: 'DNS/Web Search',
      confidence: Math.max(45, 85 - i * 8),
    })
  })

  return contacts
}

export function buildResultsFromText(query: string, text: string, sources: string[]): SearchResult {
  const contacts = buildContactsFromText(text, sources, query)

  if (contacts.length === 0) {
    return {
      organization: query,
      status: 'found',
      contacts: [],
      sources,
      timestamp: new Date().toISOString(),
    }
  }

  return {
    organization: query,
    status: 'found',
    contacts,
    sources,
    timestamp: new Date().toISOString(),
  }
}

// ─── INTELLIGENCE-POWERED SEARCH ───

export async function searchIntelligence(
  query: string,
  forcedVertical?: Vertical
): Promise<IntelligenceObject> {
  const expanded = expandQuery(query, forcedVertical)
  const vertical = expanded.vertical

  // Contact vertical: use focused LinkedIn + email queries
  const allQueries =
    vertical === 'contact'
      ? buildContactQueries(query)
      : [
          query,
          ...expanded.expansions.slice(0, 6),
          ...expanded.withOperators.slice(0, 3),
        ]

  const { text, sources, rawTexts } = await searchAllEngines(allQueries)

  const contacts = buildContactsFromText(text, sources, query)

  // Apply vertical-specific scoring rules
  const config = VERTICAL_CONFIGS[vertical]
  for (const contact of contacts) {
    for (const rule of config.scoringRules) {
      if (rule.pattern.test(contact.value) || rule.pattern.test(contact.source)) {
        contact.confidence = Math.min(100, contact.confidence + rule.score)
      }
    }
  }

  // Do NOT invent mock contacts when real search yields nothing
  if (contacts.length === 0 || text.trim().length < 80) {
    return {
      organization: query,
      vertical,
      confidence: 0,
      contacts: [],
      signals: [],
      sources,
      queryExpansions: expanded.expansions,
      timestamp: new Date().toISOString(),
      note: 'No LinkedIn profiles or emails found for this organization. Try a more specific company name or check spelling.',
    }
  }

  return buildIntelligenceObject(query, expanded, contacts, sources, rawTexts)
}

/** Minimal demo-only mock — never used as silent fallback for real searches */
export function generateMockResults(query: string): SearchResult {
  const slug = query.toLowerCase().replace(/\s+/g, '')
  return {
    organization: query,
    status: 'found',
    contacts: [
      {
        id: '1',
        type: 'email',
        value: `info@${slug}.com`,
        label: 'Example Email (demo)',
        source: 'Demo',
        confidence: 10,
      },
      {
        id: '2',
        type: 'linkedin',
        value: `https://www.linkedin.com/company/${slug}`,
        label: 'Example LinkedIn (demo)',
        source: 'Demo',
        confidence: 10,
      },
    ],
    sources: ['Demo'],
    timestamp: new Date().toISOString(),
  }
}
