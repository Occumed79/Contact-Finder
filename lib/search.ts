export interface ContactResult {
  id: string
  type: 'phone' | 'email' | 'fax' | 'linkedin' | 'website'
  value: string
  label: string
  source: string
  confidence: number
}

export interface SearchResult {
  organization: string
  status: 'idle' | 'scanning' | 'found' | 'error'
  contacts: ContactResult[]
  sources: string[]
  timestamp: string
}

export function extractEmails(text: string): string[] {
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
  return [...text.matchAll(emailRegex)].map(m => m[0])
}

export function extractPhones(text: string): string[] {
  const phoneRegex = /(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g
  return [...text.matchAll(phoneRegex)].map(m => m[0])
}

export function extractLinkedIn(text: string): string[] {
  const linkedinRegex = /linkedin\.com\/(?:company|in)\/[a-zA-Z0-9-]+/g
  return [...text.matchAll(linkedinRegex)].map(m => `https://www.${m[0]}`)
}

export function extractWebsites(text: string, domainHint?: string): string[] {
  const urlRegex = /https?:\/\/(?:www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\/[a-zA-Z0-9-._~:/?#[\]@!$&'()*+,;=]*)?/g
  const urls = [...text.matchAll(urlRegex)].map(m => m[0])
  if (domainHint) {
    return urls.filter(u => u.toLowerCase().includes(domainHint.toLowerCase()))
  }
  return urls
}

export function extractFax(text: string): string[] {
  const faxRegex = /fax[:\s]+(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/gi
  const matches = [...text.matchAll(faxRegex)].map(m => {
    const phoneMatch = m[0].match(/(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/)
    return phoneMatch ? phoneMatch[0] : null
  }).filter(Boolean) as string[]
  return matches
}

export async function searchWithSerpAPI(query: string, apiKey?: string): Promise<string> {
  if (!apiKey) {
    throw new Error('SERPAPI_KEY not configured')
  }

  const url = new URL('https://serpapi.com/search')
  url.searchParams.set('q', `${query} contact phone email`)
  url.searchParams.set('api_key', apiKey)
  url.searchParams.set('engine', 'google')
  url.searchParams.set('num', '10')

  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`SerpAPI error: ${res.status}`)

  const data = await res.json()
  const snippets = (data.organic_results || []).map((r: { snippet?: string }) => r.snippet || '').join(' ')
  return snippets
}

export async function searchWithBing(query: string, apiKey?: string): Promise<string> {
  if (!apiKey) {
    throw new Error('BING_API_KEY not configured')
  }

  const res = await fetch(
    `https://api.bing.microsoft.com/v7.0/search?q=${encodeURIComponent(query + ' contact phone email')}&count=10`,
    {
      headers: {
        'Ocp-Apim-Subscription-Key': apiKey,
      },
    }
  )
  if (!res.ok) throw new Error(`Bing API error: ${res.status}`)

  const data = await res.json()
  const snippets = (data.webPages?.value || []).map((r: { snippet?: string }) => r.snippet || '').join(' ')
  return snippets
}

export function generateMockResults(query: string): SearchResult {
  const domains = ['corp', 'inc', 'llc', 'group', 'ltd', 'solutions']
  const domain = domains[Math.floor(Math.random() * domains.length)]
  const slug = query.toLowerCase().replace(/\s+/g, '')
  const areaCode = 200 + Math.floor(Math.random() * 800)
  const prefix = 300 + Math.floor(Math.random() * 700)
  const line = 1000 + Math.floor(Math.random() * 9000)

  return {
    organization: query,
    status: 'found',
    contacts: [
      {
        id: '1',
        type: 'phone',
        value: `+1 (${areaCode}) ${prefix}-${line}`,
        label: 'Main Office',
        source: 'Corporate Registry',
        confidence: 92
      },
      {
        id: '2',
        type: 'phone',
        value: `+1 (${areaCode + 1}) ${prefix + 10}-${line + 5}`,
        label: 'Direct Line',
        source: 'Public Directory',
        confidence: 78
      },
      {
        id: '3',
        type: 'email',
        value: `contact@${slug}.${domain}.com`,
        label: 'General Inquiries',
        source: 'Website Crawl',
        confidence: 88
      },
      {
        id: '4',
        type: 'email',
        value: `info@${slug}.${domain}.com`,
        label: 'Information Desk',
        source: 'WHOIS Database',
        confidence: 85
      },
      {
        id: '5',
        type: 'fax',
        value: `+1 (${areaCode + 2}) ${prefix + 20}-${line + 10}`,
        label: 'Fax Line',
        source: 'Corporate Registry',
        confidence: 65
      },
      {
        id: '6',
        type: 'linkedin',
        value: `https://linkedin.com/company/${slug}`,
        label: 'Company Profile',
        source: 'LinkedIn API',
        confidence: 95
      },
      {
        id: '7',
        type: 'website',
        value: `https://www.${slug}.${domain}.com`,
        label: 'Official Website',
        source: 'DNS Lookup',
        confidence: 96
      }
    ],
    sources: ['Corporate Registry', 'LinkedIn API', 'WHOIS Database', 'Public Directory', 'Website Crawl', 'DNS Lookup'],
    timestamp: new Date().toISOString()
  }
}
