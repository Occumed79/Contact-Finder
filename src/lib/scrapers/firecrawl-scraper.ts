export interface FirecrawlResult {
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

// Firecrawl API integration
// Uses Firecrawl to scrape and extract structured data from websites
export async function searchFirecrawl(query: string): Promise<FirecrawlResult> {
  const apiKey = process.env.FIRECRAWL_API_KEY
  if (!apiKey) {
    return {
      text: '',
      urls: [],
      contacts: [],
      source: 'Firecrawl',
      success: false,
      error: 'FIRECRAWL_API_KEY not configured',
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
        source: 'Firecrawl',
        success: false,
        error: 'No URLs found for query',
      }
    }

    // Use Firecrawl to scrape the top URL
    const firecrawlUrl = 'https://api.firecrawl.dev/v1/scrape'
    
    const firecrawlResponse = await fetch(firecrawlUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: urls[0],
        formats: ['markdown', 'html'],
      }),
    })

    if (firecrawlResponse.status === 429) {
      return {
        text: '',
        urls,
        contacts: [],
        source: 'Firecrawl',
        success: false,
        error: 'Rate limited',
        rateLimited: true,
      }
    }

    if (!firecrawlResponse.ok) {
      const errorText = await firecrawlResponse.text()
      throw new Error(`Firecrawl error: ${firecrawlResponse.status} - ${errorText}`)
    }

    const firecrawlData = await firecrawlResponse.json()
    
    // Extract text from the scraped content
    const markdown = firecrawlData.markdown || ''
    const html = firecrawlData.html || ''
    const combinedText = markdown + ' ' + html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ')

    // Extract contacts using regex
    const contacts: FirecrawlResult['contacts'] = []

    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
    const emailMatches = combinedText.match(emailRegex)
    if (emailMatches) {
      emailMatches.forEach((email, i) => {
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
      phoneMatches.forEach((phone, i) => {
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
      linkedinMatches.forEach((linkedin, i) => {
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
      urlMatches.forEach((url, i) => {
        if (!url.includes('linkedin.com') && !url.includes('firecrawl.dev')) {
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
      source: 'Firecrawl',
      success: true,
    }
  } catch (error) {
    return {
      text: '',
      urls: [],
      contacts: [],
      source: 'Firecrawl',
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

// Alternative: Use Firecrawl's map endpoint to scrape multiple URLs
export async function firecrawlMap(query: string): Promise<FirecrawlResult> {
  const apiKey = process.env.FIRECRAWL_API_KEY
  if (!apiKey) {
    return {
      text: '',
      urls: [],
      contacts: [],
      source: 'Firecrawl Map',
      success: false,
      error: 'FIRECRAWL_API_KEY not configured',
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
        source: 'Firecrawl Map',
        success: false,
        error: 'No URLs found for query',
      }
    }

    // Use Firecrawl's map endpoint to discover all pages
    const mapUrl = 'https://api.firecrawl.dev/v1/map'
    
    const mapResponse = await fetch(mapUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: urls[0],
        search: 'contact',
      }),
    })

    if (mapResponse.status === 429) {
      return {
        text: '',
        urls,
        contacts: [],
        source: 'Firecrawl Map',
        success: false,
        error: 'Rate limited',
        rateLimited: true,
      }
    }

    if (!mapResponse.ok) {
      const errorText = await mapResponse.text()
      throw new Error(`Firecrawl error: ${mapResponse.status} - ${errorText}`)
    }

    const mapData = await mapResponse.json()
    const discoveredUrls = mapData.links || []

    // Scrape the top 3 discovered URLs
    let combinedText = ''
    const allUrls = [...urls, ...discoveredUrls].slice(0, 3)

    for (const url of allUrls) {
      try {
        const scrapeUrl = 'https://api.firecrawl.dev/v1/scrape'
        const scrapeResponse = await fetch(scrapeUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url,
            formats: ['markdown'],
          }),
        })

        if (scrapeResponse.ok) {
          const scrapeData = await scrapeResponse.json()
          combinedText += (scrapeData.markdown || '') + ' '
        }
      } catch {
        // Continue to next URL
      }
    }

    // Extract contacts
    const contacts: FirecrawlResult['contacts'] = []

    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
    const emailMatches = combinedText.match(emailRegex)
    if (emailMatches) {
      emailMatches.forEach((email, i) => {
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
      phoneMatches.forEach((phone, i) => {
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
      linkedinMatches.forEach((linkedin, i) => {
        contacts.push({
          type: 'linkedin',
          value: linkedin,
          label: i === 0 ? 'LinkedIn' : `LinkedIn ${i + 1}`,
        })
      })
    }

    return {
      text: combinedText,
      urls: allUrls,
      contacts,
      source: 'Firecrawl Map',
      success: true,
    }
  } catch (error) {
    return {
      text: '',
      urls: [],
      contacts: [],
      source: 'Firecrawl Map',
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}
