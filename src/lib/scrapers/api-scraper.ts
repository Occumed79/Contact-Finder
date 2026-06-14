export interface ApiSearchResult {
  text: string
  urls: string[]
  source: string
  success: boolean
  error?: string
  rateLimited?: boolean
}

// API configurations with rate limit tracking
const API_CONFIGS = {
  serper: {
    name: 'Serper',
    endpoint: 'https://google.serper.dev/search',
    keyEnv: 'SERPER_API_KEY',
    freeTier: '2,000 searches/month',
    rateLimitRemaining: 2000,
  },
  serpapi: {
    name: 'SerpAPI',
    endpoint: 'https://serpapi.com/search',
    keyEnv: 'SERPAPI_KEY',
    freeTier: '100 searches/month',
    rateLimitRemaining: 100,
  },
  googleCustomSearch: {
    name: 'Google Custom Search',
    endpoint: 'https://www.googleapis.com/customsearch/v1',
    keyEnv: 'GOOGLE_API_KEY',
    cxEnv: 'GOOGLE_CX',
    freeTier: '100 searches/day',
    rateLimitRemaining: 100,
  },
}

// Track rate limits in memory (in production, use Redis or database)
const rateLimitTracker: Record<string, number> = {}

export async function searchSerper(query: string): Promise<ApiSearchResult> {
  const apiKey = process.env.SERPER_API_KEY
  if (!apiKey) {
    return {
      text: '',
      urls: [],
      source: 'Serper',
      success: false,
      error: 'SERPER_API_KEY not configured',
    }
  }

  try {
    const response = await fetch(API_CONFIGS.serper.endpoint, {
      method: 'POST',
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: query,
        num: 10,
      }),
    })

    if (response.status === 429) {
      rateLimitTracker.serper = (rateLimitTracker.serper || 0) + 1
      return {
        text: '',
        urls: [],
        source: 'Serper',
        success: false,
        error: 'Rate limited',
        rateLimited: true,
      }
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const data = await response.json()

    const snippets: string[] = []
    const urls: string[] = []

    if (data.organic) {
      data.organic.forEach((item: any) => {
        if (item.snippet) snippets.push(item.snippet)
        if (item.link) urls.push(item.link)
      })
    }

    if (data.peopleAlsoAsk) {
      data.peopleAlsoAsk.forEach((item: any) => {
        if (item.snippet) snippets.push(item.snippet)
      })
    }

    return {
      text: snippets.join(' '),
      urls,
      source: 'Serper',
      success: true,
    }
  } catch (error) {
    return {
      text: '',
      urls: [],
      source: 'Serper',
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

export async function searchSerpAPI(query: string): Promise<ApiSearchResult> {
  const apiKey = process.env.SERPAPI_KEY
  if (!apiKey) {
    return {
      text: '',
      urls: [],
      source: 'SerpAPI',
      success: false,
      error: 'SERPAPI_KEY not configured',
    }
  }

  try {
    const searchUrl = `${API_CONFIGS.serpapi.endpoint}?api_key=${apiKey}&q=${encodeURIComponent(query)}&num=10`
    const response = await fetch(searchUrl)

    if (response.status === 429) {
      rateLimitTracker.serpapi = (rateLimitTracker.serpapi || 0) + 1
      return {
        text: '',
        urls: [],
        source: 'SerpAPI',
        success: false,
        error: 'Rate limited',
        rateLimited: true,
      }
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const data = await response.json()

    const snippets: string[] = []
    const urls: string[] = []

    if (data.organic_results) {
      data.organic_results.forEach((item: any) => {
        if (item.snippet) snippets.push(item.snippet)
        if (item.link) urls.push(item.link)
      })
    }

    if (data.related_questions) {
      data.related_questions.forEach((item: any) => {
        if (item.snippet) snippets.push(item.snippet)
      })
    }

    return {
      text: snippets.join(' '),
      urls,
      source: 'SerpAPI',
      success: true,
    }
  } catch (error) {
    return {
      text: '',
      urls: [],
      source: 'SerpAPI',
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

export async function searchGoogleCustomSearch(query: string): Promise<ApiSearchResult> {
  const apiKey = process.env.GOOGLE_API_KEY
  const cx = process.env.GOOGLE_CX

  if (!apiKey || !cx) {
    return {
      text: '',
      urls: [],
      source: 'Google Custom Search',
      success: false,
      error: 'GOOGLE_API_KEY or GOOGLE_CX not configured',
    }
  }

  try {
    const searchUrl = `${API_CONFIGS.googleCustomSearch.endpoint}?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(query)}&num=10`
    const response = await fetch(searchUrl)

    if (response.status === 429) {
      rateLimitTracker.googleCustomSearch = (rateLimitTracker.googleCustomSearch || 0) + 1
      return {
        text: '',
        urls: [],
        source: 'Google Custom Search',
        success: false,
        error: 'Rate limited',
        rateLimited: true,
      }
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const data = await response.json()

    const snippets: string[] = []
    const urls: string[] = []

    if (data.items) {
      data.items.forEach((item: any) => {
        if (item.snippet) snippets.push(item.snippet)
        if (item.link) urls.push(item.link)
      })
    }

    return {
      text: snippets.join(' '),
      urls,
      source: 'Google Custom Search',
      success: true,
    }
  } catch (error) {
    return {
      text: '',
      urls: [],
      source: 'Google Custom Search',
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

// Orchestrator that tries all APIs in order, skipping rate-limited ones
export async function searchAllApis(query: string): Promise<ApiSearchResult[]> {
  const results: ApiSearchResult[] = []

  const apiFunctions = [
    { fn: searchSerper, name: 'Serper' },
    { fn: searchSerpAPI, name: 'SerpAPI' },
    { fn: searchGoogleCustomSearch, name: 'Google Custom Search' },
  ]

  for (const { fn, name } of apiFunctions) {
    // Skip if rate limited
    if (rateLimitTracker[name] > 5) {
      console.warn(`${name} is rate limited, skipping`)
      continue
    }

    const result = await fn(query)
    results.push(result)

    // If successful, return immediately
    if (result.success && result.text.length > 50) {
      return [result]
    }
  }

  return results
}

// Get rate limit status
export function getRateLimitStatus(): Record<string, { remaining: number; freeTier: string }> {
  return {
    serper: {
      remaining: Math.max(0, API_CONFIGS.serper.rateLimitRemaining - (rateLimitTracker.serper || 0)),
      freeTier: API_CONFIGS.serper.freeTier,
    },
    serpapi: {
      remaining: Math.max(0, API_CONFIGS.serpapi.rateLimitRemaining - (rateLimitTracker.serpapi || 0)),
      freeTier: API_CONFIGS.serpapi.freeTier,
    },
    googleCustomSearch: {
      remaining: Math.max(0, API_CONFIGS.googleCustomSearch.rateLimitRemaining - (rateLimitTracker.googleCustomSearch || 0)),
      freeTier: API_CONFIGS.googleCustomSearch.freeTier,
    },
  }
}
