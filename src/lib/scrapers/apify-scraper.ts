export interface ApifyResult {
  text: string
  urls: string[]
  contacts: Array<{
    type: 'phone' | 'email' | 'linkedin' | 'website'
    value: string
    label: string
  }>
  source: string
  success: boolean
  error?: string
  rateLimited?: boolean
}

// Apify API integration
// Uses Apify's Web Scraper actor to extract structured data from websites
export async function searchApify(query: string): Promise<ApifyResult> {
  const apiKey = process.env.APIFY_API_KEY
  if (!apiKey) {
    return {
      text: '',
      urls: [],
      contacts: [],
      source: 'Apify',
      success: false,
      error: 'APIFY_API_KEY not configured',
    }
  }

  try {
    // First, search for relevant URLs using Serper
    const searchUrl = 'https://google.serper.dev/search'
    const searchResponse = await fetch(searchUrl, {
      method: 'POST',
      headers: {
        'X-API-KEY': process.env.SERPER_API_KEY || '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: query,
        num: 5,
      }),
    })

    if (!searchResponse.ok) {
      throw new Error(`Search failed: ${searchResponse.status}`)
    }

    const searchData = await searchResponse.json()
    const urls = searchData.organic?.map((item: any) => item.link) || []

    if (urls.length === 0) {
      return {
        text: '',
        urls: [],
        contacts: [],
        source: 'Apify',
        success: false,
        error: 'No URLs found for query',
      }
    }

    // Use Apify's Web Scraper actor to scrape the top URL
    const apifyUrl = 'https://api.apify.com/v2/acts/apify/web-scraper/run-sync'
    
    const apifyResponse = await fetch(apifyUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        startUrls: [{ url: urls[0] }],
        maxPages: 1,
        proxyConfiguration: {
          useApifyProxy: true,
        },
      }),
    })

    if (apifyResponse.status === 429) {
      return {
        text: '',
        urls,
        contacts: [],
        source: 'Apify',
        success: false,
        error: 'Rate limited',
        rateLimited: true,
      }
    }

    if (!apifyResponse.ok) {
      const errorText = await apifyResponse.text()
      throw new Error(`Apify error: ${apifyResponse.status} - ${errorText}`)
    }

    const apifyData = await apifyResponse.json()
    
    // Extract text from the scraped content
    const scrapedText = apifyData.dataset?.[0]?.text || ''
    const html = apifyData.dataset?.[0]?.html || ''
    const combinedText = scrapedText + ' ' + html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ')

    // Extract contacts using regex
    const contacts: ApifyResult['contacts'] = []

    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
    const emailMatches = combinedText.match(emailRegex)
    if (emailMatches) {
      emailMatches.forEach((email: string, i: number) => {
        if (!email.includes('@example.com')) {
          contacts.push({
            type: 'email',
            value: email,
            label: i === 0 ? 'Email' : `Email ${i + 1}`,
          })
        }
      })
    }

    const phoneRegex = /(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g
    const phoneMatches = combinedText.match(phoneRegex)
    if (phoneMatches) {
      phoneMatches.forEach((phone: string, i: number) => {
        contacts.push({
          type: 'phone',
          value: phone,
          label: i === 0 ? 'Phone' : `Phone ${i + 1}`,
        })
      })
    }

    const linkedinRegex = /https?:\/\/(?:www\.)?linkedin\.com\/(?:in|company)\/[a-zA-Z0-9-]+/g
    const linkedinMatches = combinedText.match(linkedinRegex)
    if (linkedinMatches) {
      linkedinMatches.forEach((linkedin: string, i: number) => {
        contacts.push({
          type: 'linkedin',
          value: linkedin,
          label: i === 0 ? 'LinkedIn' : `LinkedIn ${i + 1}`,
        })
      })
    }

    const urlRegex = /https?:\/\/(?:www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}/g
    const urlMatches = combinedText.match(urlRegex)
    if (urlMatches) {
      urlMatches.forEach((url: string, i: number) => {
        if (!url.includes('linkedin.com') && !url.includes('apify.com')) {
          contacts.push({
            type: 'website',
            value: url,
            label: i === 0 ? 'Website' : `Website ${i + 1}`,
          })
        }
      })
    }

    return {
      text: combinedText,
      urls,
      contacts,
      source: 'Apify',
      success: true,
    }
  } catch (error) {
    return {
      text: '',
      urls: [],
      contacts: [],
      source: 'Apify',
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

// Alternative: Use Apify's Google Search Results Scraper
export async function apifyGoogleSearch(query: string): Promise<ApifyResult> {
  const apiKey = process.env.APIFY_API_KEY
  if (!apiKey) {
    return {
      text: '',
      urls: [],
      contacts: [],
      source: 'Apify Google Search',
      success: false,
      error: 'APIFY_API_KEY not configured',
    }
  }

  try {
    const apifyUrl = 'https://api.apify.com/v2/acts/apify/google-search-scraper/run-sync'
    
    const apifyResponse = await fetch(apifyUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        queries: [query],
        maxResults: 10,
        proxyConfiguration: {
          useApifyProxy: true,
        },
      }),
    })

    if (apifyResponse.status === 429) {
      return {
        text: '',
        urls: [],
        contacts: [],
        source: 'Apify Google Search',
        success: false,
        error: 'Rate limited',
        rateLimited: true,
      }
    }

    if (!apifyResponse.ok) {
      const errorText = await apifyResponse.text()
      throw new Error(`Apify error: ${apifyResponse.status} - ${errorText}`)
    }

    const apifyData = await apifyResponse.json()
    
    // Extract text from search results
    const items = apifyData.dataset || []
    const combinedText = items.map((item: any) => {
      return `${item.title || ''} ${item.description || ''} ${item.url || ''}`.trim()
    }).join(' ')

    const urls = items.map((item: any) => item.url).filter(Boolean)

    // Extract contacts
    const contacts: ApifyResult['contacts'] = []

    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
    const emailMatches = combinedText.match(emailRegex)
    if (emailMatches) {
      emailMatches.forEach((email: string, i: number) => {
        if (!email.includes('@example.com')) {
          contacts.push({
            type: 'email',
            value: email,
            label: i === 0 ? 'Email' : `Email ${i + 1}`,
          })
        }
      })
    }

    const phoneRegex = /(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g
    const phoneMatches = combinedText.match(phoneRegex)
    if (phoneMatches) {
      phoneMatches.forEach((phone: string, i: number) => {
        contacts.push({
          type: 'phone',
          value: phone,
          label: i === 0 ? 'Phone' : `Phone ${i + 1}`,
        })
      })
    }

    const linkedinRegex = /https?:\/\/(?:www\.)?linkedin\.com\/(?:in|company)\/[a-zA-Z0-9-]+/g
    const linkedinMatches = combinedText.match(linkedinRegex)
    if (linkedinMatches) {
      linkedinMatches.forEach((linkedin: string, i: number) => {
        contacts.push({
          type: 'linkedin',
          value: linkedin,
          label: i === 0 ? 'LinkedIn' : `LinkedIn ${i + 1}`,
        })
      })
    }

    return {
      text: combinedText,
      urls,
      contacts,
      source: 'Apify Google Search',
      success: true,
    }
  } catch (error) {
    return {
      text: '',
      urls: [],
      contacts: [],
      source: 'Apify Google Search',
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}
