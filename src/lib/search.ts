import * as cheerio from 'cheerio'
import {
  isJunkEmail,
  emailMatchesOrg,
  normalizeDomainHints,
  BLOCKED_HOSTS,
} from './exclusions'
import type { ContactResult } from '../types/search'

export function extractEmails(text: string, query?: string): string[] {
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
  const raw = [...text.matchAll(emailRegex)].map(m => m[0].toLowerCase())
  const unique = [...new Set(raw)].filter(e => !isJunkEmail(e))

  if (!query || unique.length === 0) return unique.slice(0, 15)

  const relevant = unique.filter(e => emailMatchesOrg(e, query))
  if (relevant.length > 0) return relevant.slice(0, 12)

  // Soft fallback: common role accounts only
  const preferred = ['info', 'contact', 'hello', 'sales', 'support', 'hr', 'careers', 'press', 'admin']
  const soft = unique
    .filter(e => preferred.some(p => e.startsWith(p + '@')))
    .slice(0, 5)
  return soft.length > 0 ? soft : unique.slice(0, 3)
}

export function extractLinkedIn(text: string, query?: string): string[] {
  const linkedinRegex =
    /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/(company|in|school)\/[a-zA-Z0-9_-]+\/?/gi
  const matches = [...text.matchAll(linkedinRegex)].map(m => {
    let url = m[0].toLowerCase().replace(/\/$/, '')
    if (!url.startsWith('http')) url = 'https://www.' + url.replace(/^www\./, '')
    else if (!url.includes('www.')) url = url.replace('linkedin.com', 'www.linkedin.com')
    return url
  })

  const unique = [...new Set(matches)].filter(
    u => !u.includes('/share') && !u.includes('/feed') && !u.includes('/login')
  )

  if (!query || unique.length === 0) {
    const companies = unique.filter(u => u.includes('/company/'))
    return (companies.length > 0 ? companies : unique).slice(0, 8)
  }

  const hints = normalizeDomainHints(query)
  const scored = unique.map(url => {
    let score = 0
    if (url.includes('/company/')) score += 50
    if (url.includes('/school/')) score += 25
    if (url.includes('/in/')) score += 15
    const slug = url.split('/').pop() || ''
    if (hints.some(h => slug.includes(h) || h.includes(slug))) score += 40
    const qTokens = query.toLowerCase().split(/\W+/).filter(t => t.length > 2)
    if (qTokens.some(t => slug.includes(t))) score += 25
    return { url, score }
  })

  scored.sort((a, b) => b.score - a.score)
  const top = scored.filter(s => s.score >= 40).map(s => s.url)
  if (top.length > 0) return [...new Set(top)].slice(0, 10)
  return scored.slice(0, 4).map(s => s.url)
}

/**
 * Extract employee name + title pairs from text.
 * Looks for patterns like "Jane Doe, VP of Sales" or "John Smith - CEO".
 */
export function extractEmployees(
  text: string,
  query?: string
): Array<{ name: string; title: string; linkedinUrl?: string }> {
  const results: Array<{ name: string; title: string; linkedinUrl?: string }> = []
  const seen = new Set<string>()

  // Pattern: Name, Title  or  Name - Title  or  Name | Title
  const patterns = [
    /([A-Z][a-z]+(?:\s[A-Z][a-z.'-]+){1,3})\s*[,|–—-]\s*((?:CEO|CTO|CFO|COO|CMO|President|Founder|Co-Founder|VP|Vice President|Director|Manager|Head of|Chief|Partner|Principal|Lead|Senior|Engineer|Designer|Analyst|Consultant|Advisor|Officer)[^\n.,]{0,60})/g,
    /((?:CEO|CTO|CFO|COO|CMO|President|Founder|Co-Founder|VP|Vice President|Director|Manager|Head of|Chief)[^\n,]{0,40})\s*[,|–—-]\s*([A-Z][a-z]+(?:\s[A-Z][a-z.'-]+){1,3})/g,
  ]

  for (const re of patterns) {
    let m: RegExpExecArray | null
    while ((m = re.exec(text)) !== null) {
      let name = m[1].trim()
      let title = m[2].trim()

      // Second pattern has title first
      if (/^(CEO|CTO|CFO|COO|CMO|President|Founder|VP|Vice|Director|Manager|Head|Chief)/i.test(name)) {
        ;[name, title] = [title, name]
      }

      // Sanity checks
      if (name.split(' ').length < 2 || name.length > 50) continue
      if (title.length < 2 || title.length > 80) continue
      if (/^(The|A|An|This|That|Our|Their)\b/i.test(name)) continue

      const key = name.toLowerCase()
      if (seen.has(key)) continue
      seen.add(key)

      // Optional: if query provided, prefer employees whose context mentions org
      results.push({ name, title })
      if (results.length >= 15) break
    }
    if (results.length >= 15) break
  }

  // Also pull LinkedIn /in/ profiles as potential employees when query matches
  if (query) {
    const profiles = extractLinkedIn(text, query).filter(u => u.includes('/in/'))
    for (const url of profiles.slice(0, 5)) {
      const slug = url.split('/').pop() || ''
      const nameGuess = slug
        .replace(/-\d+$/, '')
        .split('-')
        .filter(p => p.length > 1)
        .map(p => p.charAt(0).toUpperCase() + p.slice(1))
        .join(' ')
      if (nameGuess.split(' ').length >= 2 && !seen.has(nameGuess.toLowerCase())) {
        seen.add(nameGuess.toLowerCase())
        results.push({ name: nameGuess, title: 'LinkedIn Profile', linkedinUrl: url })
      }
    }
  }

  return results
}

export function buildContactQueries(org: string): string[] {
  const q = org.trim()
  return [
    `"${q}" email OR contact OR "@"`,
    `"${q}" "email" OR "e-mail" OR "contact us"`,
    `site:linkedin.com/company "${q}"`,
    `"${q}" site:linkedin.com`,
    `${q} LinkedIn company`,
    `"${q}" ("info@" OR "contact@" OR "hello@" OR "sales@")`,
    `${q} leadership team OR "executive team" OR "about us"`,
    `"${q}" (CEO OR founder OR "VP of" OR director)`,
  ]
}

const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

async function fetchWithTimeout(url: string, timeout = 8000): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeout)
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
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
  $('.result__snippet').each((_, el) => snippets.push($(el).text()))
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
  $('.b_caption p, .b_algo p, li.b_algo .b_paractl').each((_, el) => snippets.push($(el).text()))
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
  $('div[data-sokoban-container] span, .VwiC3b, .s3v94d, .g span, .g .VwiC3b').each((_, el) =>
    snippets.push($(el).text())
  )
  $('a[href^="/url"]').each((_, el) => snippets.push($(el).text()))
  return snippets.join(' ')
}

export async function scrapeWebsiteForContacts(url: string): Promise<string> {
  try {
    const res = await fetchWithTimeout(url, 5000)
    if (!res.ok) return ''
    const html = await res.text()
    const $ = cheerio.load(html)
    $('script, style, nav, header, footer').remove()
    return $('body').text().replace(/\s+/g, ' ')
  } catch {
    return ''
  }
}

export function buildContactsFromText(
  text: string,
  sources: string[],
  query: string
): ContactResult[] {
  const contacts: ContactResult[] = []
  let id = 1

  const emails = extractEmails(text, query)
  const linkedins = extractLinkedIn(text, query)
  const employees = extractEmployees(text, query)

  emails.forEach((email, i) => {
    const relevant = emailMatchesOrg(email, query)
    contacts.push({
      id: String(id++),
      type: 'email',
      value: email,
      label: i === 0 ? 'Primary Email' : `Email ${i + 1}`,
      source: sources[0] || 'Web Search',
      confidence: Math.max(40, (relevant ? 88 : 55) - i * 5),
    })
  })

  linkedins.forEach((url, i) => {
    const isCompany = url.includes('/company/')
    contacts.push({
      id: String(id++),
      type: 'linkedin',
      value: url,
      label: isCompany ? 'Company LinkedIn' : 'Profile LinkedIn',
      source: 'LinkedIn Search',
      confidence: Math.max(50, (isCompany ? 94 : 78) - i * 4),
    })
  })

  employees.forEach((emp, i) => {
    contacts.push({
      id: String(id++),
      type: 'employee',
      value: emp.name,
      label: emp.title,
      title: emp.title,
      linkedinUrl: emp.linkedinUrl,
      source: sources[0] || 'Web Search',
      confidence: Math.max(45, 80 - i * 4),
    })
  })

  return contacts
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

  for (const query of queries.slice(0, 5)) {
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

  return { text: results.join(' '), sources, rawTexts }
}
