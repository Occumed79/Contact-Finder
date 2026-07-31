import { getPlaywrightScraper, closePlaywrightScraper } from './playwright-scraper'
import { searchGoogleViaProxy, searchBingViaProxy, searchDuckDuckGoViaProxy } from './cors-proxy-scraper'
import { searchAllApis } from './api-scraper'
import { scrapeAllDirectSources } from './direct-scraper'
import { searchScrapeGraphAI, scrapeGraphAIDirectSearch } from './scrapegraph-scraper'
import { searchGemini, geminiDirectSearch } from './gemini-scraper'
import { searchApify, apifyGoogleSearch } from './apify-scraper'
import { searchFirecrawl, firecrawlMap } from './firecrawl-scraper'
import { extractEmails, extractPhones, extractLinkedIn, extractWebsites, extractFax, buildContactQueries } from '../search'
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
    apify: { success: boolean; sources: string[] }
    firecrawl: { success: boolean; sources: string[] }
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
    apify: { success: false, sources: [] },
    firecrawl: { success: false, sources: [] },
  }

  let id = 1
  const addContact = (
    type: 'phone' | 'email' | 'fax' | 'linkedin' | 'website',
    value: string,
    label: string,
    source: string,
    confidence: number
  ) => {
    if (!contacts.find(c => c.value.toLowerCase() === value.toLowerCase())) {
      contacts.push({ id: String(id++), type, value, label, source, confidence })
    }
  }

  // Prefer contact-focused queries when in contact vertical
  const searchQuery =
    vertical === 'contact'
      ? buildContactQueries(query)[0] || query
      : query

  // ── Dimension 1: Playwright Headless Browser ──
  try {
    const scraper = await getPlaywrightScraper()

    const queriesToRun =
      vertical === 'contact'
        ? buildContactQueries(query).slice(0, 3)
        : [searchQuery]

    const playwrightTexts: string[] = []
    const playwrightUrls: string[] = []

    for (const q of queriesToRun) {
      const [googleResult, bingResult, ddgResult] = await Promise.allSettled([
        scraper.searchGoogle(q, 10),
        scraper.searchBing(q, 10),
        scraper.searchDuckDuckGo(q),
      ])

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
    }

    const combinedPlaywrightText = playwrightTexts.join(' ')
    if (combinedPlaywrightText.length > 50) {
      methodBreakdown.playwright.success = true
      rawTexts.push(combinedPlaywrightText)

      const emails = extractEmails(combinedPlaywrightText, query)
      const linkedins = extractLinkedIn(combinedPlaywrightText, query)
      const phones = extractPhones(combinedPlaywrightText)
      const websites = extractWebsites(combinedPlaywrightText)
      const faxes = extractFax(combinedPlaywrightText)

      emails.forEach((email, i) => addContact('email', email, i === 0 ? 'Email' : `Email ${i + 1}`, 'Playwright Search', 85))
      linkedins.forEach((linkedin, i) =>
        addContact(
          'linkedin',
          linkedin,
          linkedin.includes('/company/') ? 'LinkedIn Company' : `LinkedIn ${i + 1}`,
          'Playwright Search',
          linkedin.includes('/company/') ? 92 : 80
        )
      )
      // Secondary: phones/websites only if we have few core contacts
      if (emails.length + linkedins.length < 3) {
        phones.slice(0, 3).forEach((phone, i) => addContact('phone', phone, i === 0 ? 'Phone' : `Phone ${i + 1}`, 'Playwright Search', 70))
        websites.slice(0, 2).forEach((website, i) => addContact('website', website, i === 0 ? 'Website' : `Website ${i + 1}`, 'Playwright Search', 75))
        faxes.slice(0, 1).forEach((fax, i) => addContact('fax', fax, 'Fax', 'Playwright Search', 60))
      }

      sources.push(...methodBreakdown.playwright.sources)
    }

    // Scrape top company-like URLs
    if (playwrightUrls.length > 0) {
      const topUrls = [...new Set(playwrightUrls)].slice(0, 3)
      for (const url of topUrls) {
        try {
          const pageResult = await scraper.scrapeUrl(url)
          if (pageResult.success && pageResult.text.length > 50) {
            rawTexts.push(pageResult.text)
            sources.push(`Direct: ${new URL(url).hostname}`)

            const emails = extractEmails(pageResult.text, query)
            const linkedins = extractLinkedIn(pageResult.text, query)
            emails.forEach((email, i) => addContact('email', email, `Website Email ${i + 1}`, `Direct: ${new URL(url).hostname}`, 88))
            linkedins.forEach((li) => addContact('linkedin', li, 'LinkedIn from page', `Direct: ${new URL(url).hostname}`, 90))
          }
        } catch {
          // continue
        }
      }
    }
  } catch (error) {
    console.error('Playwright dimension failed:', error)
  }

  // ── Dimension 2: CORS Proxy ──
  try {
    const proxyQueries =
      vertical === 'contact' ? buildContactQueries(query).slice(0, 2) : [query]

    const corsTexts: string[] = []
    for (const q of proxyQueries) {
      const [googleProxy, bingProxy, ddgProxy] = await Promise.allSettled([
        searchGoogleViaProxy(q),
        searchBingViaProxy(q),
        searchDuckDuckGoViaProxy(q),
      ])

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
    }

    const combinedCorsText = corsTexts.join(' ')
    if (combinedCorsText.length > 50) {
      methodBreakdown.corsProxy.success = true
      rawTexts.push(combinedCorsText)

      const emails = extractEmails(combinedCorsText, query)
      const linkedins = extractLinkedIn(combinedCorsText, query)
      emails.forEach((email, i) => addContact('email', email, `CORS Email ${i + 1}`, 'CORS Proxy', 80))
      linkedins.forEach((linkedin, i) =>
        addContact('linkedin', linkedin, linkedin.includes('/company/') ? 'LinkedIn Company' : `CORS LinkedIn ${i + 1}`, 'CORS Proxy', 83)
      )

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

        const emails = extractEmails(result.text, query)
        const linkedins = extractLinkedIn(result.text, query)
        emails.forEach((email, i) => addContact('email', email, `API Email ${i + 1}`, result.source, 92))
        linkedins.forEach((linkedin, i) => addContact('linkedin', linkedin, `API LinkedIn ${i + 1}`, result.source, 94))

        sources.push(result.source)
      }
    }
  } catch (error) {
    console.error('API dimension failed:', error)
  }

  // ── Dimension 4: Direct Source Scraping (LinkedIn company, website, etc.) ──
  try {
    const directResults = await scrapeAllDirectSources(query, vertical)

    for (const result of directResults) {
      if (result.success && result.contacts.length > 0) {
        methodBreakdown.direct.success = true
        methodBreakdown.direct.sources.push(result.source)

        for (const contact of result.contacts) {
          // Re-filter emails through our stricter extractor when possible
          if (contact.type === 'email') {
            const cleaned = extractEmails(contact.value, query)
            if (cleaned.length === 0 && extractEmails(contact.value).length === 0) continue
          }
          addContact(contact.type, contact.value, contact.label, `${result.source} (${contact.source})`, contact.confidence)
        }

        sources.push(result.source)
      }
    }
  } catch (error) {
    console.error('Direct scraping dimension failed:', error)
  }

  // ── Dimensions 5–8: optional paid/AI services (only add if they return contacts) ──
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

  try {
    const [apifyResult, apifyGoogleResult] = await Promise.allSettled([
      searchApify(query),
      apifyGoogleSearch(query),
    ])

    if (apifyResult.status === 'fulfilled' && apifyResult.value.success) {
      methodBreakdown.apify.success = true
      methodBreakdown.apify.sources.push('Apify')
      rawTexts.push(apifyResult.value.text)
      for (const contact of apifyResult.value.contacts) {
        addContact(contact.type, contact.value, contact.label, 'Apify', 92)
      }
      sources.push('Apify')
    }

    if (apifyGoogleResult.status === 'fulfilled' && apifyGoogleResult.value.success) {
      methodBreakdown.apify.success = true
      methodBreakdown.apify.sources.push('Apify Google Search')
      rawTexts.push(apifyGoogleResult.value.text)
      for (const contact of apifyGoogleResult.value.contacts) {
        addContact(contact.type, contact.value, contact.label, 'Apify Google Search', 92)
      }
      sources.push('Apify Google Search')
    }
  } catch (error) {
    console.error('Apify dimension failed:', error)
  }

  try {
    const [firecrawlResult, firecrawlMapResult] = await Promise.allSettled([
      searchFirecrawl(query),
      firecrawlMap(query),
    ])

    if (firecrawlResult.status === 'fulfilled' && firecrawlResult.value.success) {
      methodBreakdown.firecrawl.success = true
      methodBreakdown.firecrawl.sources.push('Firecrawl')
      rawTexts.push(firecrawlResult.value.text)
      for (const contact of firecrawlResult.value.contacts) {
        addContact(contact.type, contact.value, contact.label, 'Firecrawl', 93)
      }
      sources.push('Firecrawl')
    }

    if (firecrawlMapResult.status === 'fulfilled' && firecrawlMapResult.value.success) {
      methodBreakdown.firecrawl.success = true
      methodBreakdown.firecrawl.sources.push('Firecrawl Map')
      rawTexts.push(firecrawlMapResult.value.text)
      for (const contact of firecrawlMapResult.value.contacts) {
        addContact(contact.type, contact.value, contact.label, 'Firecrawl Map', 93)
      }
      sources.push('Firecrawl Map')
    }
  } catch (error) {
    console.error('Firecrawl dimension failed:', error)
  }

  await closePlaywrightScraper()

  // Prefer LinkedIn + email; demote pure phone/fax/website when core contacts exist
  const hasCore = contacts.some(c => c.type === 'email' || c.type === 'linkedin')
  const finalContacts = hasCore
    ? contacts.filter(c => c.type === 'email' || c.type === 'linkedin' || c.type === 'website').slice(0, 25)
    : contacts.slice(0, 15)

  const totalMethodsAttempted = 8
  const successfulMethods = [
    methodBreakdown.playwright.success,
    methodBreakdown.corsProxy.success,
    methodBreakdown.api.success,
    methodBreakdown.direct.success,
    methodBreakdown.scrapegraph.success,
    methodBreakdown.gemini.success,
    methodBreakdown.apify.success,
    methodBreakdown.firecrawl.success,
  ].filter(Boolean).length

  return {
    contacts: finalContacts,
    sources: [...new Set(sources)],
    rawTexts,
    methodBreakdown,
    totalMethodsAttempted,
    successfulMethods,
  }
}
