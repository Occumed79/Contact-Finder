import { getPlaywrightScraper, closePlaywrightScraper } from './playwright-scraper'
import { searchGoogleViaProxy, searchBingViaProxy, searchDuckDuckGoViaProxy } from './cors-proxy-scraper'
import { searchAllApis } from './api-scraper'
import { scrapeAllDirectSources } from './direct-scraper'
import { searchScrapeGraphAI, scrapeGraphAIDirectSearch } from './scrapegraph-scraper'
import { searchGemini, geminiDirectSearch } from './gemini-scraper'
import { searchApify, apifyGoogleSearch } from './apify-scraper'
import { searchFirecrawl, firecrawlMap } from './firecrawl-scraper'
import {
  extractEmails,
  extractLinkedIn,
  extractEmployees,
  buildContactQueries,
  buildContactsFromText,
} from '../search'
import type { ContactResult } from '../../types/search'
import { applyLearningFilter } from '../learning'

export interface MultiDimensionResult {
  contacts: ContactResult[]
  sources: string[]
  rawTexts: string[]
  methodBreakdown: {
    playwright: { success: boolean; sources: string[] }
    corsProxy: { success: boolean; sources: string[] }
    api: { success: boolean; sources: string[] }
    direct: { success: boolean; sources: string[] }
    scrapegraph: { success: boolean; sources: string[] }
    gemini: { success: boolean; sources: string[] }
    apify: { success: boolean; sources: string[] }
    firecrawl: { success: boolean; sources: string[] }
  }
  totalMethodsAttempted: number
  successfulMethods: number
}

export async function multiDimensionSearch(query: string): Promise<MultiDimensionResult> {
  const contacts: ContactResult[] = []
  const sources: string[] = []
  const rawTexts: string[] = []

  const methodBreakdown: MultiDimensionResult['methodBreakdown'] = {
    playwright: { success: false, sources: [] },
    corsProxy: { success: false, sources: [] },
    api: { success: false, sources: [] },
    direct: { success: false, sources: [] },
    scrapegraph: { success: false, sources: [] },
    gemini: { success: false, sources: [] },
    apify: { success: false, sources: [] },
    firecrawl: { success: false, sources: [] },
  }

  let id = 1
  const addContact = (c: Omit<ContactResult, 'id'>) => {
    if (!contacts.find(x => x.value.toLowerCase() === c.value.toLowerCase() && x.type === c.type)) {
      contacts.push({ ...c, id: String(id++) })
    }
  }

  const mergeFromText = (text: string, source: string, confidenceBase = 80) => {
    if (text.length < 40) return
    rawTexts.push(text)
    const built = buildContactsFromText(text, [source], query)
    for (const c of built) {
      addContact({
        type: c.type,
        value: c.value,
        label: c.label,
        source,
        confidence: Math.min(100, Math.round((c.confidence + confidenceBase) / 2)),
        title: c.title,
        linkedinUrl: c.linkedinUrl,
      })
    }
  }

  // ── 1. Playwright ──
  try {
    const scraper = await getPlaywrightScraper()
    const queries = buildContactQueries(query).slice(0, 3)
    const texts: string[] = []
    const urls: string[] = []

    for (const q of queries) {
      const [g, b, d] = await Promise.allSettled([
        scraper.searchGoogle(q, 10),
        scraper.searchBing(q, 10),
        scraper.searchDuckDuckGo(q),
      ])
      if (g.status === 'fulfilled' && g.value.success) {
        texts.push(g.value.text)
        urls.push(...g.value.urls)
        methodBreakdown.playwright.sources.push('Google (Playwright)')
      }
      if (b.status === 'fulfilled' && b.value.success) {
        texts.push(b.value.text)
        urls.push(...b.value.urls)
        methodBreakdown.playwright.sources.push('Bing (Playwright)')
      }
      if (d.status === 'fulfilled' && d.value.success) {
        texts.push(d.value.text)
        urls.push(...d.value.urls)
        methodBreakdown.playwright.sources.push('DuckDuckGo (Playwright)')
      }
    }

    const combined = texts.join(' ')
    if (combined.length > 50) {
      methodBreakdown.playwright.success = true
      mergeFromText(combined, 'Playwright Search', 85)
      sources.push(...methodBreakdown.playwright.sources)
    }

    for (const url of [...new Set(urls)].slice(0, 3)) {
      try {
        const page = await scraper.scrapeUrl(url)
        if (page.success && page.text.length > 50) {
          mergeFromText(page.text, `Direct: ${new URL(url).hostname}`, 88)
          sources.push(`Direct: ${new URL(url).hostname}`)
        }
      } catch {
        /* skip */
      }
    }
  } catch (e) {
    console.error('Playwright failed:', e)
  }

  // ── 2. CORS Proxy ──
  try {
    const texts: string[] = []
    for (const q of buildContactQueries(query).slice(0, 2)) {
      const [g, b, d] = await Promise.allSettled([
        searchGoogleViaProxy(q),
        searchBingViaProxy(q),
        searchDuckDuckGoViaProxy(q),
      ])
      if (g.status === 'fulfilled' && g.value.success) {
        texts.push(g.value.text)
        methodBreakdown.corsProxy.sources.push('Google (CORS)')
      }
      if (b.status === 'fulfilled' && b.value.success) {
        texts.push(b.value.text)
        methodBreakdown.corsProxy.sources.push('Bing (CORS)')
      }
      if (d.status === 'fulfilled' && d.value.success) {
        texts.push(d.value.text)
        methodBreakdown.corsProxy.sources.push('DuckDuckGo (CORS)')
      }
    }
    const combined = texts.join(' ')
    if (combined.length > 50) {
      methodBreakdown.corsProxy.success = true
      mergeFromText(combined, 'CORS Proxy', 78)
      sources.push(...methodBreakdown.corsProxy.sources)
    }
  } catch (e) {
    console.error('CORS failed:', e)
  }

  // ── 3. Search APIs (Serper / SerpAPI) — highest priority when keys present ──
  try {
    for (const q of buildContactQueries(query).slice(0, 3)) {
      const apiResults = await searchAllApis(q)
      for (const result of apiResults) {
        if (result.success && result.text.length > 50) {
          methodBreakdown.api.success = true
          methodBreakdown.api.sources.push(result.source)
          mergeFromText(result.text, result.source, 92)
          sources.push(result.source)
        }
      }
    }
  } catch (e) {
    console.error('API failed:', e)
  }

  // ── 4. Direct sources (LinkedIn company, website) ──
  try {
    const directResults = await scrapeAllDirectSources(query, 'contact')
    for (const result of directResults) {
      if (result.success && result.contacts.length > 0) {
        methodBreakdown.direct.success = true
        methodBreakdown.direct.sources.push(result.source)
        for (const c of result.contacts) {
          if (c.type === 'email' || c.type === 'linkedin') {
            addContact({
              type: c.type as 'email' | 'linkedin',
              value: c.value,
              label: c.label,
              source: result.source,
              confidence: c.confidence,
            })
          }
        }
        sources.push(result.source)
      }
    }
  } catch (e) {
    console.error('Direct failed:', e)
  }

  // ── 5–8 Optional paid services ──
  const runOptional = async (
    key: keyof typeof methodBreakdown,
    label: string,
    fns: Array<() => Promise<{ success: boolean; text: string; contacts?: Array<{ type: string; value: string; label: string }> }>>
  ) => {
    try {
      const settled = await Promise.allSettled(fns.map(f => f()))
      for (const r of settled) {
        if (r.status === 'fulfilled' && r.value.success) {
          methodBreakdown[key].success = true
          methodBreakdown[key].sources.push(label)
          if (r.value.text) mergeFromText(r.value.text, label, 90)
          if (r.value.contacts) {
            for (const c of r.value.contacts) {
              if (c.type === 'email' || c.type === 'linkedin') {
                addContact({
                  type: c.type as 'email' | 'linkedin',
                  value: c.value,
                  label: c.label,
                  source: label,
                  confidence: 90,
                })
              }
            }
          }
          sources.push(label)
        }
      }
    } catch (e) {
      console.error(`${label} failed:`, e)
    }
  }

  await runOptional('scrapegraph', 'ScrapeGraphAI', [
    () => searchScrapeGraphAI(query),
    () => scrapeGraphAIDirectSearch(query),
  ])
  await runOptional('gemini', 'Gemini', [
    () => searchGemini(query),
    () => geminiDirectSearch(query),
  ])
  await runOptional('apify', 'Apify', [
    () => searchApify(query),
    () => apifyGoogleSearch(query),
  ])
  await runOptional('firecrawl', 'Firecrawl', [
    () => searchFirecrawl(query),
    () => firecrawlMap(query),
  ])

  await closePlaywrightScraper()

  // Learning filter
  const filtered = applyLearningFilter(contacts, query)

  // Prefer emails + linkedin + employees only (already the only types)
  const finalContacts = filtered.slice(0, 40)

  const successfulMethods = Object.values(methodBreakdown).filter(m => m.success).length

  return {
    contacts: finalContacts,
    sources: [...new Set(sources)],
    rawTexts,
    methodBreakdown,
    totalMethodsAttempted: 8,
    successfulMethods,
  }
}
