import { getPlaywrightScraper } from './playwright-scraper'

export interface DirectScrapeResult {
  contacts: Array<{
    type: 'phone' | 'email' | 'fax' | 'linkedin' | 'website'
    value: string
    label: string
    source: string
    confidence: number
  }>
  source: string
  success: boolean
  error?: string
}

// LinkedIn Company Page Scraper
export async function scrapeLinkedInCompany(companyName: string): Promise<DirectScrapeResult> {
  const scraper = await getPlaywrightScraper()
  const contacts: DirectScrapeResult['contacts'] = []

  try {
    const searchQuery = `${companyName} site:linkedin.com/company`
    const searchResult = await scraper.searchGoogle(searchQuery, 5)

    if (!searchResult.success || searchResult.urls.length === 0) {
      return {
        contacts,
        source: 'LinkedIn Company',
        success: false,
        error: 'No LinkedIn company page found',
      }
    }

    const companyUrl = searchResult.urls[0]
    const pageResult = await scraper.scrapeUrl(companyUrl)

    if (!pageResult.success) {
      return {
        contacts,
        source: 'LinkedIn Company',
        success: false,
        error: 'Failed to scrape LinkedIn page',
      }
    }

    const text = pageResult.text

    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
    const emailMatches = text.match(emailRegex)
    if (emailMatches) {
      emailMatches.forEach((email, i) => {
        if (!email.includes('@linkedin.com')) {
          contacts.push({
            type: 'email',
            value: email,
            label: i === 0 ? 'Company Email' : `Email ${i + 1}`,
            source: 'LinkedIn Company Page',
            confidence: 85,
          })
        }
      })
    }

    contacts.push({
      type: 'linkedin',
      value: companyUrl,
      label: 'LinkedIn Company Profile',
      source: 'LinkedIn',
      confidence: 95,
    })

    return {
      contacts,
      source: 'LinkedIn Company',
      success: true,
    }
  } catch (error) {
    return {
      contacts,
      source: 'LinkedIn Company',
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

// Business Registry Scraper
export async function scrapeBusinessRegistry(companyName: string, state = 'DE'): Promise<DirectScrapeResult> {
  const scraper = await getPlaywrightScraper()
  const contacts: DirectScrapeResult['contacts'] = []

  try {
    const searchQuery = `${companyName} business entity ${state} site:sos.${state.toLowerCase()}.gov OR site:delaware.gov OR site:opencorporates.com`
    const searchResult = await scraper.searchGoogle(searchQuery, 5)

    if (!searchResult.success) {
      return {
        contacts,
        source: 'Business Registry',
        success: false,
        error: 'Search failed',
      }
    }

    const text = searchResult.text

    const phoneRegex = /(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g
    const phoneMatches = text.match(phoneRegex)
    if (phoneMatches) {
      phoneMatches.forEach((phone, i) => {
        contacts.push({
          type: 'phone',
          value: phone,
          label: i === 0 ? 'Registered Phone' : `Phone ${i + 1}`,
          source: `Business Registry (${state})`,
          confidence: 90,
        })
      })
    }

    return {
      contacts,
      source: 'Business Registry',
      success: contacts.length > 0,
    }
  } catch (error) {
    return {
      contacts,
      source: 'Business Registry',
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

// Crunchbase Scraper
export async function scrapeCrunchbase(companyName: string): Promise<DirectScrapeResult> {
  const scraper = await getPlaywrightScraper()
  const contacts: DirectScrapeResult['contacts'] = []

  try {
    const searchQuery = `${companyName} site:crunchbase.com`
    const searchResult = await scraper.searchGoogle(searchQuery, 5)

    if (!searchResult.success || searchResult.urls.length === 0) {
      return {
        contacts,
        source: 'Crunchbase',
        success: false,
        error: 'No Crunchbase profile found',
      }
    }

    const crunchbaseUrl = searchResult.urls[0]
    const pageResult = await scraper.scrapeUrl(crunchbaseUrl)

    if (!pageResult.success) {
      return {
        contacts,
        source: 'Crunchbase',
        success: false,
        error: 'Failed to scrape Crunchbase',
      }
    }

    const text = pageResult.text

    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
    const emailMatches = text.match(emailRegex)
    if (emailMatches) {
      emailMatches.forEach((email, i) => {
        contacts.push({
          type: 'email',
          value: email,
          label: i === 0 ? 'Company Email' : `Email ${i + 1}`,
          source: 'Crunchbase',
          confidence: 82,
        })
      })
    }

    const urlRegex = /https?:\/\/(?:www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}/g
    const urlMatches = text.match(urlRegex)
    if (urlMatches) {
      urlMatches.forEach((url, i) => {
        if (!url.includes('crunchbase.com')) {
          contacts.push({
            type: 'website',
            value: url,
            label: i === 0 ? 'Company Website' : `Website ${i + 1}`,
            source: 'Crunchbase',
            confidence: 90,
          })
        }
      })
    }

    return {
      contacts,
      source: 'Crunchbase',
      success: contacts.length > 0,
    }
  } catch (error) {
    return {
      contacts,
      source: 'Crunchbase',
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

// SAM.gov Scraper
export async function scrapeSAMgov(companyName: string): Promise<DirectScrapeResult> {
  const scraper = await getPlaywrightScraper()
  const contacts: DirectScrapeResult['contacts'] = []

  try {
    const searchQuery = `${companyName} site:sam.gov OR site:beta.sam.gov`
    const searchResult = await scraper.searchGoogle(searchQuery, 5)

    if (!searchResult.success) {
      return {
        contacts,
        source: 'SAM.gov',
        success: false,
        error: 'Search failed',
      }
    }

    const text = searchResult.text

    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
    const emailMatches = text.match(emailRegex)
    if (emailMatches) {
      emailMatches.forEach((email, i) => {
        contacts.push({
          type: 'email',
          value: email,
          label: i === 0 ? 'Federal Contract Email' : `Email ${i + 1}`,
          source: 'SAM.gov',
          confidence: 85,
        })
      })
    }

    const phoneRegex = /(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g
    const phoneMatches = text.match(phoneRegex)
    if (phoneMatches) {
      phoneMatches.forEach((phone, i) => {
        contacts.push({
          type: 'phone',
          value: phone,
          label: i === 0 ? 'Federal Contract Phone' : `Phone ${i + 1}`,
          source: 'SAM.gov',
          confidence: 85,
        })
      })
    }

    return {
      contacts,
      source: 'SAM.gov',
      success: contacts.length > 0,
    }
  } catch (error) {
    return {
      contacts,
      source: 'SAM.gov',
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

// Company Website Scraper
export async function scrapeCompanyWebsite(companyName: string): Promise<DirectScrapeResult> {
  const scraper = await getPlaywrightScraper()
  const contacts: DirectScrapeResult['contacts'] = []

  try {
    const searchQuery = `${companyName} official website`
    const searchResult = await scraper.searchGoogle(searchQuery, 5)

    if (!searchResult.success || searchResult.urls.length === 0) {
      return {
        contacts,
        source: 'Company Website',
        success: false,
        error: 'No website found',
      }
    }

    const contactKeywords = ['contact', 'about', 'team', 'leadership', 'locations']
    const contactUrls: string[] = []

    for (const url of searchResult.urls) {
      if (contactKeywords.some(keyword => url.toLowerCase().includes(keyword))) {
        contactUrls.push(url)
      }
    }

    const urlsToScrape = contactUrls.length > 0 ? contactUrls : [searchResult.urls[0]]

    for (const url of urlsToScrape) {
      try {
        const pageResult = await scraper.scrapeUrl(url)

        if (!pageResult.success) continue

        const text = pageResult.text

        const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
        const emailMatches = text.match(emailRegex)
        if (emailMatches) {
          emailMatches.forEach((email, i) => {
            if (!email.includes('@example.com')) {
              contacts.push({
                type: 'email',
                value: email,
                label: email.includes('sales') ? 'Sales Email' : email.includes('support') ? 'Support Email' : 'Company Email',
                source: 'Company Website',
                confidence: 88,
              })
            }
          })
        }

        const phoneRegex = /(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g
        const phoneMatches = text.match(phoneRegex)
        if (phoneMatches) {
          phoneMatches.forEach((phone, i) => {
            contacts.push({
              type: 'phone',
              value: phone,
              label: i === 0 ? 'Main Phone' : `Phone ${i + 1}`,
              source: 'Company Website',
              confidence: 90,
            })
          })
        }

        const faxRegex = /fax[:\s]+(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/gi
        const faxMatches = text.match(faxRegex)
        if (faxMatches) {
          faxMatches.forEach((fax, i) => {
            const phoneMatch = fax.match(/(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/)
            if (phoneMatch) {
              contacts.push({
                type: 'fax',
                value: phoneMatch[0],
                label: i === 0 ? 'Main Fax' : `Fax ${i + 1}`,
                source: 'Company Website',
                confidence: 75,
              })
            }
          })
        }

        contacts.push({
          type: 'website',
          value: url,
          label: 'Company Website',
          source: 'Company Website',
          confidence: 95,
        })

        if (contacts.length > 1) break
      } catch {
        continue
      }
    }

    return {
      contacts,
      source: 'Company Website',
      success: contacts.length > 0,
    }
  } catch (error) {
    return {
      contacts,
      source: 'Company Website',
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

// Healthcare Directory Scraper
export async function scrapeHealthcareDirectory(providerName: string): Promise<DirectScrapeResult> {
  const scraper = await getPlaywrightScraper()
  const contacts: DirectScrapeResult['contacts'] = []

  try {
    const searchQuery = `${providerName} healthcare provider site:healthgrades.com OR site:webmd.com OR site:vitals.com OR site:zocdoc.com`
    const searchResult = await scraper.searchGoogle(searchQuery, 5)

    if (!searchResult.success) {
      return {
        contacts,
        source: 'Healthcare Directory',
        success: false,
        error: 'Search failed',
      }
    }

    const text = searchResult.text

    const phoneRegex = /(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g
    const phoneMatches = text.match(phoneRegex)
    if (phoneMatches) {
      phoneMatches.forEach((phone, i) => {
        contacts.push({
          type: 'phone',
          value: phone,
          label: i === 0 ? 'Provider Phone' : `Phone ${i + 1}`,
          source: 'Healthcare Directory',
          confidence: 88,
        })
      })
    }

    return {
      contacts,
      source: 'Healthcare Directory',
      success: contacts.length > 0,
    }
  } catch (error) {
    return {
      contacts,
      source: 'Healthcare Directory',
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

// Run all direct scrapers in parallel
export async function scrapeAllDirectSources(companyName: string, vertical: string): Promise<DirectScrapeResult[]> {
  const results: DirectScrapeResult[] = []

  const scrapers = [
    scrapeLinkedInCompany(companyName),
    scrapeBusinessRegistry(companyName),
    scrapeCrunchbase(companyName),
    scrapeCompanyWebsite(companyName),
  ]

  if (vertical === 'procurement') {
    scrapers.push(scrapeSAMgov(companyName))
  }
  if (vertical === 'provider') {
    scrapers.push(scrapeHealthcareDirectory(companyName))
  }

  const scraperResults = await Promise.allSettled(scrapers)

  scraperResults.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      results.push(result.value)
    } else {
      console.error(`Direct scraper ${index} failed:`, result.reason)
    }
  })

  return results
}
