export interface ScrapeGraphResult {
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

// ScrapeGraphAI API integration
// ScrapeGraphAI uses AI to extract structured data from websites
export async function searchScrapeGraphAI(query: string): Promise<ScrapeGraphResult> {
  const apiKey = process.env.SCRAPEGRAPHAI_API_KEY
  if (!apiKey) {
    return {
      text: '',
      urls: [],
      contacts: [],
      source: 'ScrapeGraphAI',
      success: false,
      error: 'SCRAPEGRAPHAI_API_KEY not configured',
    }
  }

  try {
    // First, search for relevant URLs using a search API
    // Then use ScrapeGraphAI to scrape those URLs
    const searchUrl = `https://google.serper.dev/search`
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
        source: 'ScrapeGraphAI',
        success: false,
        error: 'No URLs found for query',
      }
    }

    // Now scrape the top URLs using ScrapeGraphAI
    const scrapeUrl = 'https://api.scrapegraphai.com/v1/smartscraper'
    const scrapeResponse = await fetch(scrapeUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        website_url: urls[0],
        user_prompt: `Extract all contact information including emails, phone numbers, LinkedIn profiles, and company websites. Return the data in a structured format.`,
      }),
    })

    if (scrapeResponse.status === 429) {
      return {
        text: '',
        urls,
        contacts: [],
        source: 'ScrapeGraphAI',
        success: false,
        error: 'Rate limited',
        rateLimited: true,
      }
    }

    if (!scrapeResponse.ok) {
      throw new Error(`ScrapeGraphAI error: ${scrapeResponse.status}`)
    }

    const scrapeData = await scrapeResponse.json()

    // Extract text from the response
    const text = typeof scrapeData === 'string' ? scrapeData : JSON.stringify(scrapeData)

    // Extract contacts from the AI response
    const contacts: ScrapeGraphResult['contacts'] = []

    // Extract emails
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
    const emailMatches = text.match(emailRegex)
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

    // Extract phones
    const phoneRegex = /(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g
    const phoneMatches = text.match(phoneRegex)
    if (phoneMatches) {
      phoneMatches.forEach((phone, i) => {
        contacts.push({
          type: 'phone',
          value: phone,
          label: i === 0 ? 'Phone' : `Phone ${i + 1}`,
        })
      })
    }

    // Extract LinkedIn URLs
    const linkedinRegex = /https?:\/\/(?:www\.)?linkedin\.com\/(?:in|company)\/[a-zA-Z0-9-]+/g
    const linkedinMatches = text.match(linkedinRegex)
    if (linkedinMatches) {
      linkedinMatches.forEach((linkedin, i) => {
        contacts.push({
          type: 'linkedin',
          value: linkedin,
          label: i === 0 ? 'LinkedIn' : `LinkedIn ${i + 1}`,
        })
      })
    }

    // Extract websites
    const urlRegex = /https?:\/\/(?:www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}/g
    const urlMatches = text.match(urlRegex)
    if (urlMatches) {
      urlMatches.forEach((url, i) => {
        if (!url.includes('linkedin.com') && !url.includes('scrapegraphai.com')) {
          contacts.push({
            type: 'website',
            value: url,
            label: i === 0 ? 'Website' : `Website ${i + 1}`,
          })
        }
      })
    }

    return {
      text,
      urls,
      contacts,
      source: 'ScrapeGraphAI',
      success: true,
    }
  } catch (error) {
    return {
      text: '',
      urls: [],
      contacts: [],
      source: 'ScrapeGraphAI',
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

// Alternative: Use ScrapeGraphAI's search endpoint if available
export async function scrapeGraphAIDirectSearch(query: string): Promise<ScrapeGraphResult> {
  const apiKey = process.env.SCRAPEGRAPHAI_API_KEY
  if (!apiKey) {
    return {
      text: '',
      urls: [],
      contacts: [],
      source: 'ScrapeGraphAI Direct',
      success: false,
      error: 'SCRAPEGRAPHAI_API_KEY not configured',
    }
  }

  try {
    // Try ScrapeGraphAI's direct search/scrape endpoint
    const apiUrl = 'https://api.scrapegraphai.com/v1/smartscraper'
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_prompt: `Search for and extract contact information for "${query}". Find emails, phone numbers, LinkedIn profiles, and company websites.`,
        website_url: 'https://www.google.com/search?q=' + encodeURIComponent(query),
      }),
    })

    if (response.status === 429) {
      return {
        text: '',
        urls: [],
        contacts: [],
        source: 'ScrapeGraphAI Direct',
        success: false,
        error: 'Rate limited',
        rateLimited: true,
      }
    }

    if (!response.ok) {
      throw new Error(`ScrapeGraphAI error: ${response.status}`)
    }

    const data = await response.json()
    const text = typeof data === 'string' ? data : JSON.stringify(data)

    // Extract contacts
    const contacts: ScrapeGraphResult['contacts'] = []
    const urls: string[] = []

    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
    const emailMatches = text.match(emailRegex)
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
    const phoneMatches = text.match(phoneRegex)
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
    const linkedinMatches = text.match(linkedinRegex)
    if (linkedinMatches) {
      linkedinMatches.forEach((linkedin, i) => {
        contacts.push({
          type: 'linkedin',
          value: linkedin,
          label: i === 0 ? 'LinkedIn' : `LinkedIn ${i + 1}`,
        })
        urls.push(linkedin)
      })
    }

    const urlRegex = /https?:\/\/(?:www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}/g
    const urlMatches = text.match(urlRegex)
    if (urlMatches) {
      urlMatches.forEach((url) => {
        if (!url.includes('linkedin.com') && !url.includes('scrapegraphai.com') && !url.includes('google.com')) {
          urls.push(url)
        }
      })
    }

    return {
      text,
      urls,
      contacts,
      source: 'ScrapeGraphAI Direct',
      success: true,
    }
  } catch (error) {
    return {
      text: '',
      urls: [],
      contacts: [],
      source: 'ScrapeGraphAI Direct',
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}
