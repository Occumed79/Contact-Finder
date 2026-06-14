import { getPlaywrightScraper, closePlaywrightScraper, type PlaywrightScrapeResult } from './playwright-scraper'
import { fetchViaCorsProxy, searchGoogleViaProxy, searchBingViaProxy, searchDuckDuckGoViaProxy, type CorsProxyResult } from './cors-proxy-scraper'
import { searchAllApis, type ApiSearchResult } from './api-scraper'
import { scrapeAllDirectSources, type DirectScrapeResult } from './direct-scraper'
import { searchScrapeGraphAI, scrapeGraphAIDirectSearch, type ScrapeGraphResult } from './scrapegraph-scraper'
import { searchGemini, geminiDirectSearch, type GeminiResult } from './gemini-scraper'
import { extractEmails, extractPhones, extractLinkedIn, extractWebsites, extractFax } from '../search'
import type { Vertical } from '../intelligence'

export interface MultiDimensionResult {
  contacts: Array<{
    id: string
    type: 'phone' | 'email' | 'fax' | 'linkedin' | 'website'
    value: string
    label: string
    source: string
    confidence: number
  }>
  sources: string[]
  rawTexts: string[]
  methodBreakdown: {
    playwright: { success: boolean; sources: string[] }
    corsProxy: { success: boolean; sources: string[] }
    api: { success: boolean; sources: string[] }
    direct: { success: boolean; sources: string[] }
    scrapegraph: { success: boolean; sources: string[] }
    gemini: { success: boolean; sources: string[] }
  }
  totalMethodsAttempted: number
  successfulMethods: number
}

export async function multiDimensionSearch(
  query: string,
  vertical: Vertical
): Promise<MultiDimensionResult> {
  const contacts: MultiDimensionResult['contacts'] = []
  const sources: string[] = []
  const rawTexts: string[] = []

  const methodBreakdown: MultiDimensionResult['methodBreakdown'] = {
    playwright: { success: false, sources: [] },
    corsProxy: { success: false, sources: [] },
    api: { success: false, sources: [] },
    direct: { success: false, sources: [] },
    scrapegraph: { success: false, sources: [] },
    gemini: { success: false, sources: [] },
  }

  let id = 1
  const addContact = (
    type: 'phone' | 'email' | 'fax' | 'linkedin' | 'website',
    value: string,
    label: string,
    source: string,
    confidence: number
  ) => {
    // Deduplicate by value
    if (!contacts.find(c => c.value === value)) {
      contacts.push({ id: String(id++), type, value, label, source, confidence })
    }
  }

  // ── Dimension 1: Playwright Headless Browser ──
  try {
    const scraper = await getPlaywrightScraper()

    // Run all search engines in parallel
    const [googleResult, bingResult, ddgResult] = await Promise.allSettled([
      scraper.searchGoogle(query, 10),
      scraper.searchBing(query, 10),
      scraper.searchDuckDuckGo(query),
    ])

    const playwrightTexts: string[] = []
    const playwrightUrls: string[] = []

    if (googleResult.status === 'fulfilled' && googleResult.value.success) {
      playwrightTexts.push(googleResult.value.text)
      playwrightUrls.push(...googleResult.value.urls)
      methodBreakdown.playwright.sources.push('Google (Playwright)')
    }
    if (bingResult.status === 'fulfilled' && bingResult.value.success) {
      playwrightTexts.push(bingResult.value.text)
      playwrightUrls.push(...bingResult.value.urls)
      methodBreakdown.playwright.sources.push('Bing (Playwright)')
    }
    if (ddgResult.status === 'fulfilled' && ddgResult.value.success) {
      playwrightTexts.push(ddgResult.value.text)
      playwrightUrls.push(...ddgResult.value.urls)
      methodBreakdown.playwright.sources.push('DuckDuckGo (Playwright)')
    }

    const combinedPlaywrightText = playwrightTexts.join(' ')
    if (combinedPlaywrightText.length > 50) {
      methodBreakdown.playwright.success = true
      rawTexts.push(combinedPlaywrightText)

      // Extract contacts
      const emails = extractEmails(combinedPlaywrightText)
      const phones = extractPhones(combinedPlaywrightText)
      const linkedins = extractLinkedIn(combinedPlaywrightText)
      const websites = extractWebsites(combinedPlaywrightText)
      const faxes = extractFax(combinedPlaywrightText)

      emails.forEach((email, i) => addContact('email', email, i === 0 ? 'Email' : `Email ${i + 1}`, 'Playwright Search', 85))
      phones.forEach((phone, i) => addContact('phone', phone, i === 0 ? 'Phone' : `Phone ${i + 1}`, 'Playwright Search', 82))
      linkedins.forEach((linkedin, i) => addContact('linkedin', linkedin, i === 0 ? 'LinkedIn' : `LinkedIn ${i + 1}`, 'Playwright Search', 88))
      websites.forEach((website, i) => addContact('website', website, i === 0 ? 'Website' : `Website ${i + 1}`, 'Playwright Search', 90))
      faxes.forEach((fax, i) => addContact('fax', fax, i === 0 ? 'Fax' : `Fax ${i + 1}`, 'Playwright Search', 75))

      sources.push(...methodBreakdown.playwright.sources)
    }

    // Scrape top URLs found
    if (playwrightUrls.length > 0) {
      const topUrls = playwrightUrls.slice(0, 3)
      for (const url of topUrls) {
        try {
          const pageResult = await scraper.scrapeUrl(url)
          if (pageResult.success && pageResult.text.length > 50) {
            rawTexts.push(pageResult.text)
            sources.push(`Direct: ${new URL(url).hostname}`)

            const emails = extractEmails(pageResult.text)
            const phones = extractPhones(pageResult.text)
            const faxes = extractFax(pageResult.text)

            emails.forEach((email, i) => addContact('email', email, `Website Email ${i + 1}`, `Direct: ${new URL(url).hostname}`, 88))
            phones.forEach((phone, i) => addContact('phone', phone, `Website Phone ${i + 1}`, `Direct: ${new URL(url).hostname}`, 85))
            faxes.forEach((fax, i) => addContact('fax', fax, `Website Fax ${i + 1}`, `Direct: ${new URL(url).hostname}`, 78))
          }
        } catch {
          // Continue to next URL
        }
      }
    }
  } catch (error) {
    console.error('Playwright dimension failed:', error)
  }

  // ── Dimension 2: CORS Proxy ──
  try {
    const [googleProxy, bingProxy, ddgProxy] = await Promise.allSettled([
      searchGoogleViaProxy(query),
      searchBingViaProxy(query),
      searchDuckDuckGoViaProxy(query),
    ])

    const corsTexts: string[] = []

    if (googleProxy.status === 'fulfilled' && googleProxy.value.success) {
      corsTexts.push(googleProxy.value.text)
      methodBreakdown.corsProxy.sources.push('Google (CORS Proxy)')
    }
    if (bingProxy.status === 'fulfilled' && bingProxy.value.success) {
      corsTexts.push(bingProxy.value.text)
      methodBreakdown.corsProxy.sources.push('Bing (CORS Proxy)')
    }
    if (ddgProxy.status === 'fulfilled' && ddgProxy.value.success) {
      corsTexts.push(ddgProxy.value.text)
      methodBreakdown.corsProxy.sources.push('DuckDuckGo (CORS Proxy)')
    }

    const combinedCorsText = corsTexts.join(' ')
    if (combinedCorsText.length > 50) {
      methodBreakdown.corsProxy.success = true
      rawTexts.push(combinedCorsText)

      const emails = extractEmails(combinedCorsText)
      const phones = extractPhones(combinedCorsText)
      const linkedins = extractLinkedIn(combinedCorsText)
      const websites = extractWebsites(combinedCorsText)

      emails.forEach((email, i) => addContact('email', email, `CORS Email ${i + 1}`, 'CORS Proxy', 80))
      phones.forEach((phone, i) => addContact('phone', phone, `CORS Phone ${i + 1}`, 'CORS Proxy', 78))
      linkedins.forEach((linkedin, i) => addContact('linkedin', linkedin, `CORS LinkedIn ${i + 1}`, 'CORS Proxy', 83))
      websites.forEach((website, i) => addContact('website', website, `CORS Website ${i + 1}`, 'CORS Proxy', 85))

      sources.push(...methodBreakdown.corsProxy.sources)
    }
  } catch (error) {
    console.error('CORS proxy dimension failed:', error)
  }

  // ── Dimension 3: Search APIs ──
  try {
    const apiResults = await searchAllApis(query)

    for (const result of apiResults) {
      if (result.success && result.text.length > 50) {
        methodBreakdown.api.success = true
        methodBreakdown.api.sources.push(result.source)
        rawTexts.push(result.text)

        const emails = extractEmails(result.text)
        const phones = extractPhones(result.text)
        const linkedins = extractLinkedIn(result.text)
        const websites = extractWebsites(result.text)

        emails.forEach((email, i) => addContact('email', email, `API Email ${i + 1}`, result.source, 92))
        phones.forEach((phone, i) => addContact('phone', phone, `API Phone ${i + 1}`, result.source, 90))
        linkedins.forEach((linkedin, i) => addContact('linkedin', linkedin, `API LinkedIn ${i + 1}`, result.source, 94))
        websites.forEach((website, i) => addContact('website', website, `API Website ${i + 1}`, result.source, 95))

        sources.push(result.source)
      }
    }
  } catch (error) {
    console.error('API dimension failed:', error)
  }

  // ── Dimension 4: Direct Source Scraping ──
  try {
    const directResults = await scrapeAllDirectSources(query, vertical)

    for (const result of directResults) {
      if (result.success && result.contacts.length > 0) {
        methodBreakdown.direct.success = true
        methodBreakdown.direct.sources.push(result.source)

        for (const contact of result.contacts) {
          addContact(contact.type, contact.value, contact.label, `${result.source} (${contact.source})`, contact.confidence)
        }

        sources.push(result.source)
      }
    }
  } catch (error) {
    console.error('Direct scraping dimension failed:', error)
  }

  // ── Dimension 5: ScrapeGraphAI ──
  try {
    const [sgResult, sgDirectResult] = await Promise.allSettled([
      searchScrapeGraphAI(query),
      scrapeGraphAIDirectSearch(query),
    ])

    if (sgResult.status === 'fulfilled' && sgResult.value.success) {
      methodBreakdown.scrapegraph.success = true
      methodBreakdown.scrapegraph.sources.push('ScrapeGraphAI')
      rawTexts.push(sgResult.value.text)

      for (const contact of sgResult.value.contacts) {
        addContact(contact.type, contact.value, contact.label, 'ScrapeGraphAI', 93)
      }

      sources.push('ScrapeGraphAI')
    }

    if (sgDirectResult.status === 'fulfilled' && sgDirectResult.value.success) {
      methodBreakdown.scrapegraph.success = true
      methodBreakdown.scrapegraph.sources.push('ScrapeGraphAI Direct')
      rawTexts.push(sgDirectResult.value.text)

      for (const contact of sgDirectResult.value.contacts) {
        addContact(contact.type, contact.value, contact.label, 'ScrapeGraphAI Direct', 93)
      }

      sources.push('ScrapeGraphAI Direct')
    }
  } catch (error) {
    console.error('ScrapeGraphAI dimension failed:', error)
  }

  // ── Dimension 6: Gemini AI ──
  try {
    const [geminiResult, geminiDirectResult] = await Promise.allSettled([
      searchGemini(query),
      geminiDirectSearch(query),
    ])

    if (geminiResult.status === 'fulfilled' && geminiResult.value.success) {
      methodBreakdown.gemini.success = true
      methodBreakdown.gemini.sources.push('Gemini')
      rawTexts.push(geminiResult.value.text)

      for (const contact of geminiResult.value.contacts) {
        addContact(contact.type, contact.value, contact.label, 'Gemini', 94)
      }

      sources.push('Gemini')
    }

    if (geminiDirectResult.status === 'fulfilled' && geminiDirectResult.value.success) {
      methodBreakdown.gemini.success = true
      methodBreakdown.gemini.sources.push('Gemini Direct')
      rawTexts.push(geminiDirectResult.value.text)

      for (const contact of geminiDirectResult.value.contacts) {
        addContact(contact.type, contact.value, contact.label, 'Gemini Direct', 94)
      }

      sources.push('Gemini Direct')
    }
  } catch (error) {
    console.error('Gemini dimension failed:', error)
  }

  // ── Cleanup ──
  await closePlaywrightScraper()

  // ── Calculate stats ──
  const totalMethodsAttempted = 6
  const successfulMethods = [
    methodBreakdown.playwright.success,
    methodBreakdown.corsProxy.success,
    methodBreakdown.api.success,
    methodBreakdown.direct.success,
    methodBreakdown.scrapegraph.success,
    methodBreakdown.gemini.success,
  ].filter(Boolean).length

  return {
    contacts,
    sources: [...new Set(sources)],
    rawTexts,
    methodBreakdown,
    totalMethodsAttempted,
    successfulMethods,
  }
}
