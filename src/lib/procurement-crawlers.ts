import * as cheerio from 'cheerio'
import type { ScrapedResult } from '../types/search'

// ─── SPECIALIZED PROCUREMENT CRAWLERS ───

export type CrawlerStatus = 'success' | 'timeout' | 'blocked' | 'error' | 'empty'

export interface CrawlerDiagnostics {
  source: string
  status: CrawlerStatus
  resultsCount: number
  error?: string
  latency?: number
}

export interface ProcurementOpportunity {
  id: string
  title: string
  organization: string
  opportunityType: 'RFP' | 'RFQ' | 'RFT' | 'solicitation' | 'bid' | 'tender' | 'procurement'
  dueDate?: string
  postedDate?: string
  documentUrl: string
  sourceUrl: string
  source: string
  monetaryValue?: string
  status?: 'open' | 'active' | 'closed' | 'awarded'
  description?: string
  contactEmail?: string
  contactPhone?: string
}

const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

async function fetchWithTimeout(url: string, timeout = 10000): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeout)
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
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

/**
 * Crawl SAM.gov for federal procurement opportunities
 */
export async function crawlSAMGov(query: string): Promise<{ opportunities: ProcurementOpportunity[]; diagnostics: CrawlerDiagnostics }> {
  const opportunities: ProcurementOpportunity[] = []
  const startTime = Date.now()
  
  try {
    const searchUrl = `https://sam.gov/search/?keywords=${encodeURIComponent(query)}&index=opp&pageSize=10`
    const res = await fetchWithTimeout(searchUrl)
    
    if (!res.ok) {
      return {
        opportunities,
        diagnostics: {
          source: 'SAM.gov',
          status: res.status === 403 || res.status === 429 ? 'blocked' : 'error',
          resultsCount: 0,
          error: `HTTP ${res.status}: ${res.statusText}`,
          latency: Date.now() - startTime,
        },
      }
    }
    
    const html = await res.text()
    const $ = cheerio.load(html)
    
    // Check for blocked/limited content
    if (html.includes('Access Denied') || html.includes('captcha') || html.includes('bot detection')) {
      return {
        opportunities,
        diagnostics: {
          source: 'SAM.gov',
          status: 'blocked',
          resultsCount: 0,
          error: 'Blocked by bot detection or access control',
          latency: Date.now() - startTime,
        },
      }
    }
    
    $('.usa-card, .solicitation-card, .card, .listing, .opportunity, .result').each((_, el) => {
      const title = $(el).find('.usa-card__heading, .title, h3, h4, h2, .heading, .solicitation-title').first().text().trim()
      const link = $(el).find('a[href]').first().attr('href')
      const organization = $(el).find('.org-name, .agency, .organization, .entity, .department, .office').first().text().trim()
      const dueDate = $(el).find('.due-date, .deadline, .closing-date, .close-date, .response-date').first().text().trim()
      const postedDate = $(el).find('.posted-date, .post-date, .publish-date, .created-date').first().text().trim()
      
      if (title && link) {
        const fullUrl = link.startsWith('http') ? link : `https://sam.gov${link}`
        
        let opportunityType: ProcurementOpportunity['opportunityType'] = 'procurement'
        if (/rfp/i.test(title)) opportunityType = 'RFP'
        else if (/rfq/i.test(title)) opportunityType = 'RFQ'
        else if (/solicitation/i.test(title)) opportunityType = 'solicitation'
        
        opportunities.push({
          id: fullUrl,
          title,
          organization: organization || 'Federal Agency',
          opportunityType,
          dueDate: dueDate || undefined,
          postedDate: postedDate || undefined,
          documentUrl: fullUrl,
          sourceUrl: fullUrl,
          source: 'SAM.gov',
          status: 'open',
        })
      }
    })
    
    return {
      opportunities,
      diagnostics: {
        source: 'SAM.gov',
        status: opportunities.length > 0 ? 'success' : 'empty',
        resultsCount: opportunities.length,
        latency: Date.now() - startTime,
      },
    }
  } catch (err) {
    return {
      opportunities,
      diagnostics: {
        source: 'SAM.gov',
        status: 'error',
        resultsCount: 0,
        error: err instanceof Error ? err.message : 'Unknown error',
        latency: Date.now() - startTime,
      },
    }
  }
}

/**
 * Crawl BonfireHub for procurement opportunities
 */
export async function crawlBonfireHub(query: string): Promise<{ opportunities: ProcurementOpportunity[]; diagnostics: CrawlerDiagnostics }> {
  const opportunities: ProcurementOpportunity[] = []
  const startTime = Date.now()
  
  try {
    const searchUrl = `https://bonfirehub.com/public/?q=${encodeURIComponent(query)}`
    const res = await fetchWithTimeout(searchUrl)
    
    if (!res.ok) {
      return {
        opportunities,
        diagnostics: {
          source: 'BonfireHub',
          status: res.status === 403 || res.status === 429 ? 'blocked' : 'error',
          resultsCount: 0,
          error: `HTTP ${res.status}: ${res.statusText}`,
          latency: Date.now() - startTime,
        },
      }
    }
    
    const html = await res.text()
    const $ = cheerio.load(html)
    
    if (html.includes('Access Denied') || html.includes('captcha') || html.includes('bot detection')) {
      return {
        opportunities,
        diagnostics: {
          source: 'BonfireHub',
          status: 'blocked',
          resultsCount: 0,
          error: 'Blocked by bot detection or access control',
          latency: Date.now() - startTime,
        },
      }
    }
    
    $('.opportunity-card, .card, .listing, .result, .item').each((_, el) => {
      const title = $(el).find('.opportunity-title, .title, h3, h4, h2, .heading').first().text().trim()
      const link = $(el).find('a[href]').first().attr('href')
      const organization = $(el).find('.organization, .agency, .entity, .department').first().text().trim()
      const dueDate = $(el).find('.closing-date, .deadline, .close-date, .response-date').first().text().trim()
      
      if (title && link) {
        const fullUrl = link.startsWith('http') ? link : `https://bonfirehub.com${link}`
        
        let opportunityType: ProcurementOpportunity['opportunityType'] = 'procurement'
        if (/rfp/i.test(title)) opportunityType = 'RFP'
        else if (/rfq/i.test(title)) opportunityType = 'RFQ'
        
        opportunities.push({
          id: fullUrl,
          title,
          organization: organization || 'Unknown',
          opportunityType,
          dueDate: dueDate || undefined,
          documentUrl: fullUrl,
          sourceUrl: fullUrl,
          source: 'BonfireHub',
          status: 'open',
        })
      }
    })
    
    return {
      opportunities,
      diagnostics: {
        source: 'BonfireHub',
        status: opportunities.length > 0 ? 'success' : 'empty',
        resultsCount: opportunities.length,
        latency: Date.now() - startTime,
      },
    }
  } catch (err) {
    return {
      opportunities,
      diagnostics: {
        source: 'BonfireHub',
        status: 'error',
        resultsCount: 0,
        error: err instanceof Error ? err.message : 'Unknown error',
        latency: Date.now() - startTime,
      },
    }
  }
}

/**
 * Crawl PlanetBids for procurement opportunities
 */
export async function crawlPlanetBids(query: string): Promise<{ opportunities: ProcurementOpportunity[]; diagnostics: CrawlerDiagnostics }> {
  const opportunities: ProcurementOpportunity[] = []
  const startTime = Date.now()
  
  try {
    const searchUrl = `https://planetbids.com/search?q=${encodeURIComponent(query)}`
    const res = await fetchWithTimeout(searchUrl)
    
    if (!res.ok) {
      return {
        opportunities,
        diagnostics: {
          source: 'PlanetBids',
          status: res.status === 403 || res.status === 429 ? 'blocked' : 'error',
          resultsCount: 0,
          error: `HTTP ${res.status}: ${res.statusText}`,
          latency: Date.now() - startTime,
        },
      }
    }
    
    const html = await res.text()
    const $ = cheerio.load(html)
    
    if (html.includes('Access Denied') || html.includes('captcha') || html.includes('bot detection')) {
      return {
        opportunities,
        diagnostics: {
          source: 'PlanetBids',
          status: 'blocked',
          resultsCount: 0,
          error: 'Blocked by bot detection or access control',
          latency: Date.now() - startTime,
        },
      }
    }
    
    $('.bid-item, .card, .listing, .result, .item, .opportunity').each((_, el) => {
      const title = $(el).find('.bid-title, .title, h3, h4, h2, .heading').first().text().trim()
      const link = $(el).find('a[href]').first().attr('href')
      const organization = $(el).find('.agency, .organization, .entity, .department').first().text().trim()
      const dueDate = $(el).find('.due-date, .deadline, .close-date, .response-date').first().text().trim()
      
      if (title && link) {
        const fullUrl = link.startsWith('http') ? link : `https://planetbids.com${link}`
        
        let opportunityType: ProcurementOpportunity['opportunityType'] = 'procurement'
        if (/rfp/i.test(title)) opportunityType = 'RFP'
        else if (/rfq/i.test(title)) opportunityType = 'RFQ'
        
        opportunities.push({
          id: fullUrl,
          title,
          organization: organization || 'Unknown',
          opportunityType,
          dueDate: dueDate || undefined,
          documentUrl: fullUrl,
          sourceUrl: fullUrl,
          source: 'PlanetBids',
          status: 'open',
        })
      }
    })
    
    return {
      opportunities,
      diagnostics: {
        source: 'PlanetBids',
        status: opportunities.length > 0 ? 'success' : 'empty',
        resultsCount: opportunities.length,
        latency: Date.now() - startTime,
      },
    }
  } catch (err) {
    return {
      opportunities,
      diagnostics: {
        source: 'PlanetBids',
        status: 'error',
        resultsCount: 0,
        error: err instanceof Error ? err.message : 'Unknown error',
        latency: Date.now() - startTime,
      },
    }
  }
}

/**
 * Crawl IonWave for procurement opportunities
 */
export async function crawlIonWave(query: string): Promise<{ opportunities: ProcurementOpportunity[]; diagnostics: CrawlerDiagnostics }> {
  const opportunities: ProcurementOpportunity[] = []
  const startTime = Date.now()
  
  try {
    const searchUrl = `https://ionwave.net/search?q=${encodeURIComponent(query)}`
    const res = await fetchWithTimeout(searchUrl)
    
    if (!res.ok) {
      return {
        opportunities,
        diagnostics: {
          source: 'IonWave',
          status: res.status === 403 || res.status === 429 ? 'blocked' : 'error',
          resultsCount: 0,
          error: `HTTP ${res.status}: ${res.statusText}`,
          latency: Date.now() - startTime,
        },
      }
    }
    
    const html = await res.text()
    const $ = cheerio.load(html)
    
    if (html.includes('Access Denied') || html.includes('captcha') || html.includes('bot detection')) {
      return {
        opportunities,
        diagnostics: {
          source: 'IonWave',
          status: 'blocked',
          resultsCount: 0,
          error: 'Blocked by bot detection or access control',
          latency: Date.now() - startTime,
        },
      }
    }
    
    $('.solicitation-item, .card, .listing, .result, .item, .opportunity').each((_, el) => {
      const title = $(el).find('.solicitation-title, .title, h3, h4, h2, .heading').first().text().trim()
      const link = $(el).find('a[href]').first().attr('href')
      const organization = $(el).find('.entity, .agency, .organization, .department').first().text().trim()
      const dueDate = $(el).find('.close-date, .deadline, .due-date, .response-date').first().text().trim()
      
      if (title && link) {
        const fullUrl = link.startsWith('http') ? link : `https://ionwave.net${link}`
        
        let opportunityType: ProcurementOpportunity['opportunityType'] = 'procurement'
        if (/rfp/i.test(title)) opportunityType = 'RFP'
        else if (/rfq/i.test(title)) opportunityType = 'RFQ'
        
        opportunities.push({
          id: fullUrl,
          title,
          organization: organization || 'Unknown',
          opportunityType,
          dueDate: dueDate || undefined,
          documentUrl: fullUrl,
          sourceUrl: fullUrl,
          source: 'IonWave',
          status: 'open',
        })
      }
    })
    
    return {
      opportunities,
      diagnostics: {
        source: 'IonWave',
        status: opportunities.length > 0 ? 'success' : 'empty',
        resultsCount: opportunities.length,
        latency: Date.now() - startTime,
      },
    }
  } catch (err) {
    return {
      opportunities,
      diagnostics: {
        source: 'IonWave',
        status: 'error',
        resultsCount: 0,
        error: err instanceof Error ? err.message : 'Unknown error',
        latency: Date.now() - startTime,
      },
    }
  }
}

/**
 * Crawl BidNetDirect for procurement opportunities
 */
export async function crawlBidNetDirect(query: string): Promise<{ opportunities: ProcurementOpportunity[]; diagnostics: CrawlerDiagnostics }> {
  const opportunities: ProcurementOpportunity[] = []
  const startTime = Date.now()
  
  try {
    const searchUrl = `https://bidnetdirect.com/search?q=${encodeURIComponent(query)}`
    const res = await fetchWithTimeout(searchUrl)
    
    if (!res.ok) {
      return {
        opportunities,
        diagnostics: {
          source: 'BidNetDirect',
          status: res.status === 403 || res.status === 429 ? 'blocked' : 'error',
          resultsCount: 0,
          error: `HTTP ${res.status}: ${res.statusText}`,
          latency: Date.now() - startTime,
        },
      }
    }
    
    const html = await res.text()
    const $ = cheerio.load(html)
    
    if (html.includes('Access Denied') || html.includes('captcha') || html.includes('bot detection')) {
      return {
        opportunities,
        diagnostics: {
          source: 'BidNetDirect',
          status: 'blocked',
          resultsCount: 0,
          error: 'Blocked by bot detection or access control',
          latency: Date.now() - startTime,
        },
      }
    }
    
    $('.opportunity, .card, .listing, .result, .item, .bid-item').each((_, el) => {
      const title = $(el).find('.opp-title, .title, h3, h4, h2, .heading').first().text().trim()
      const link = $(el).find('a[href]').first().attr('href')
      const organization = $(el).find('.agency, .organization, .entity, .department').first().text().trim()
      const dueDate = $(el).find('.deadline, .due-date, .close-date, .response-date').first().text().trim()
      
      if (title && link) {
        const fullUrl = link.startsWith('http') ? link : `https://bidnetdirect.com${link}`
        
        let opportunityType: ProcurementOpportunity['opportunityType'] = 'procurement'
        if (/rfp/i.test(title)) opportunityType = 'RFP'
        else if (/rfq/i.test(title)) opportunityType = 'RFQ'
        
        opportunities.push({
          id: fullUrl,
          title,
          organization: organization || 'Unknown',
          opportunityType,
          dueDate: dueDate || undefined,
          documentUrl: fullUrl,
          sourceUrl: fullUrl,
          source: 'BidNetDirect',
          status: 'open',
        })
      }
    })
    
    return {
      opportunities,
      diagnostics: {
        source: 'BidNetDirect',
        status: opportunities.length > 0 ? 'success' : 'empty',
        resultsCount: opportunities.length,
        latency: Date.now() - startTime,
      },
    }
  } catch (err) {
    return {
      opportunities,
      diagnostics: {
        source: 'BidNetDirect',
        status: 'error',
        resultsCount: 0,
        error: err instanceof Error ? err.message : 'Unknown error',
        latency: Date.now() - startTime,
      },
    }
  }
}

/**
 * Crawl county procurement portals (generic pattern)
 */
export async function crawlCountyPortals(query: string, county: string): Promise<ProcurementOpportunity[]> {
  const opportunities: ProcurementOpportunity[] = []
  
  try {
    const searchUrl = `https://www.${county.toLowerCase().replace(/\s+/g, '')}.gov/procurement?q=${encodeURIComponent(query)}`
    const res = await fetchWithTimeout(searchUrl)
    if (!res.ok) return opportunities
    
    const html = await res.text()
    const $ = cheerio.load(html)
    
    $('.procurement-item, .bid-item, .rfp-item').each((_, el) => {
      const title = $(el).find('.title, h3, h4').first().text().trim()
      const link = $(el).find('a').first().attr('href')
      const dueDate = $(el).find('.due-date, .deadline, .closing').first().text().trim()
      
      if (title && link) {
        const fullUrl = link.startsWith('http') ? link : `https://www.${county.toLowerCase().replace(/\s+/g, '')}.gov${link}`
        
        let opportunityType: ProcurementOpportunity['opportunityType'] = 'procurement'
        if (/rfp/i.test(title)) opportunityType = 'RFP'
        else if (/rfq/i.test(title)) opportunityType = 'RFQ'
        
        opportunities.push({
          id: fullUrl,
          title,
          organization: county,
          opportunityType,
          dueDate: dueDate || undefined,
          documentUrl: fullUrl,
          sourceUrl: fullUrl,
          source: `County: ${county}`,
          status: 'open',
        })
      }
    })
  } catch (err) {
    console.warn(`County portal crawl failed for ${county}:`, err)
  }
  
  return opportunities
}

/**
 * Run all procurement crawlers in parallel
 */
export async function crawlAllProcurementSources(
  query: string,
  counties?: string[]
): Promise<{ opportunities: ProcurementOpportunity[]; diagnostics: CrawlerDiagnostics[] }> {
  const allOpportunities: ProcurementOpportunity[] = []
  const allDiagnostics: CrawlerDiagnostics[] = []
  
  // Run major procurement portals in parallel
  const [samGov, bonfire, planetBids, ionWave, bidNet] = await Promise.all([
    crawlSAMGov(query),
    crawlBonfireHub(query),
    crawlPlanetBids(query),
    crawlIonWave(query),
    crawlBidNetDirect(query),
  ])
  
  allOpportunities.push(...samGov.opportunities, ...bonfire.opportunities, ...planetBids.opportunities, ...ionWave.opportunities, ...bidNet.opportunities)
  allDiagnostics.push(samGov.diagnostics, bonfire.diagnostics, planetBids.diagnostics, ionWave.diagnostics, bidNet.diagnostics)
  
  // Crawl county portals if specified
  if (counties && counties.length > 0) {
    const countyResults = await Promise.all(
      counties.map(county => crawlCountyPortals(query, county))
    )
    countyResults.forEach(results => allOpportunities.push(...results))
  }
  
  // Deduplicate by URL
  const seen = new Set<string>()
  const deduplicated = allOpportunities.filter(opp => {
    if (seen.has(opp.id)) return false
    seen.add(opp.id)
    return true
  })
  
  return { opportunities: deduplicated, diagnostics: allDiagnostics }
}

/**
 * Convert procurement opportunities to ScrapedResult format
 */
export function procurementToScrapedResult(opp: ProcurementOpportunity): ScrapedResult {
  return {
    title: opp.title,
    url: opp.documentUrl,
    description: `${opp.organization} - ${opp.opportunityType}${opp.dueDate ? ` - Due: ${opp.dueDate}` : ''}`,
    domain: new URL(opp.documentUrl).hostname.replace(/^www\./, ''),
    source: opp.source,
    rank: 0,
    score: 0,
    resultType: 'procurement',
  }
}
