export interface CorsProxyResult {
  text: string
  url: string
  source: string
  success: boolean
  error?: string
}

// List of CORS proxies with their characteristics
const CORS_PROXIES = [
  {
    name: 'AllOrigins',
    url: (target: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(target)}`,
    reliable: true,
    rateLimit: 'Unknown',
  },
  {
    name: 'CORS Anywhere (Demo)',
    url: (target: string) => `https://cors-anywhere.herokuapp.com/${target}`,
    reliable: false, // Demo server, often down
    rateLimit: 'Unknown',
  },
  {
    name: 'ThingProxy',
    url: (target: string) => `https://thingproxy.freeboard.io/fetch/${target}`,
    reliable: true,
    rateLimit: 'Unknown',
  },
  {
    name: 'CORS Proxy (Alt)',
    url: (target: string) => `https://corsproxy.io/?${encodeURIComponent(target)}`,
    reliable: true,
    rateLimit: 'Unknown',
  },
]

export async function fetchViaCorsProxy(
  targetUrl: string,
  timeout = 10000
): Promise<CorsProxyResult> {
  // Try proxies in order of reliability
  for (const proxy of CORS_PROXIES) {
    try {
      const proxyUrl = proxy.url(targetUrl)
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), timeout)

      const response = await fetch(proxyUrl, {
        signal: controller.signal,
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      })

      clearTimeout(timer)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const text = await response.text()

      if (text.length < 10) {
        throw new Error('Empty response')
      }

      return {
        text,
        url: targetUrl,
        source: `${proxy.name} Proxy`,
        success: true,
      }
    } catch (error) {
      console.warn(`${proxy.name} failed:`, error)
      continue // Try next proxy
    }
  }

  return {
    text: '',
    url: targetUrl,
    source: 'All CORS Proxies',
    success: false,
    error: 'All CORS proxies failed',
  }
}

// Search-specific CORS proxy methods
export async function searchGoogleViaProxy(query: string): Promise<CorsProxyResult> {
  const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}&num=10&hl=en`
  return fetchViaCorsProxy(searchUrl)
}

export async function searchBingViaProxy(query: string): Promise<CorsProxyResult> {
  const searchUrl = `https://www.bing.com/search?q=${encodeURIComponent(query)}&count=10`
  return fetchViaCorsProxy(searchUrl)
}

export async function searchDuckDuckGoViaProxy(query: string): Promise<CorsProxyResult> {
  const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`
  return fetchViaCorsProxy(searchUrl)
}

// Extract contacts from HTML returned via proxy
export function extractContactsFromHtml(html: string, source: string): {
  emails: string[]
  phones: string[]
  urls: string[]
} {
  const emails: string[] = []
  const phones: string[] = []
  const urls: string[] = []

  // Extract emails
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
  const emailMatches = html.match(emailRegex)
  if (emailMatches) {
    emailMatches.forEach(email => {
      if (!email.endsWith('.png') && !email.endsWith('.jpg') && !email.includes('@example.com')) {
        emails.push(email)
      }
    })
  }

  // Extract phones
  const phoneRegex = /(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g
  const phoneMatches = html.match(phoneRegex)
  if (phoneMatches) {
    phoneMatches.forEach(phone => {
      if (!emails.includes(phone)) {
        phones.push(phone)
      }
    })
  }

  // Extract URLs
  const urlRegex = /https?:\/\/(?:www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\/[a-zA-Z0-9-._~:/?#[\]@!$&'()*+,;=]*)?/g
  const urlMatches = html.match(urlRegex)
  if (urlMatches) {
    urlMatches.forEach(url => {
      if (!url.includes('google.com') && !url.includes('bing.com') && !url.includes('duckduckgo.com')) {
        urls.push(url)
      }
    })
  }

  return { emails, phones, urls }
}
