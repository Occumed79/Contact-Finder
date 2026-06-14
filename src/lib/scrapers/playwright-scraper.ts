import { chromium, Browser, Page, BrowserContext } from 'playwright'

export interface PlaywrightScrapeResult {
  text: string
  urls: string[]
  pageTitle?: string
  source: string
  success: boolean
  error?: string
}

export class PlaywrightScraper {
  private browser: Browser | null = null
  private context: BrowserContext | null = null
  private available: boolean = false

  async init() {
    if (this.browser) return

    try {
      this.browser = await chromium.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-blink-features=AutomationControlled',
        ],
      })

      this.context = await this.browser.newContext({
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        viewport: { width: 1920, height: 1080 },
        locale: 'en-US',
        timezoneId: 'America/New_York',
      })

      // Add stealth measures
      await this.context.addInitScript(() => {
        Object.defineProperty(navigator, 'webdriver', { get: () => false })
        Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] })
        Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] })
      })

      this.available = true
    } catch (error) {
      console.error('Failed to initialize Playwright (will skip this dimension):', error)
      this.available = false
      // Don't throw - allow other dimensions to work
    }
  }

  isAvailable(): boolean {
    return this.available && this.browser !== null && this.context !== null
  }

  async scrapeUrl(url: string, timeout = 10000): Promise<PlaywrightScrapeResult> {
    if (!this.isAvailable()) {
      await this.init()
    }

    if (!this.isAvailable()) {
      return {
        text: '',
        urls: [],
        source: url,
        success: false,
        error: 'Playwright not available (serverless environment)',
      }
    }

    const page = await this.context!.newPage()

    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout })

      // Wait a bit for dynamic content
      await page.waitForTimeout(1000)

      // Extract text content
      const text = await page.evaluate(() => {
        // Remove script, style, nav, footer elements
        const elementsToRemove = document.querySelectorAll('script, style, nav, footer, header, iframe, svg')
        elementsToRemove.forEach(el => el.remove())
        return document.body.innerText.replace(/\s+/g, ' ').trim()
      })

      // Extract all URLs
      const urls = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('a[href]'))
        return links
          .map(a => (a as HTMLAnchorElement).href)
          .filter(href => href.startsWith('http'))
      })

      // Get page title
      const pageTitle = await page.title()

      return {
        text,
        urls,
        pageTitle,
        source: url,
        success: true,
      }
    } catch (error) {
      return {
        text: '',
        urls: [],
        source: url,
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }
    } finally {
      await page.close()
    }
  }

  async searchGoogle(query: string, numResults = 10): Promise<PlaywrightScrapeResult> {
    if (!this.isAvailable()) {
      await this.init()
    }

    if (!this.isAvailable()) {
      return {
        text: '',
        urls: [],
        pageTitle: `Google Search: ${query}`,
        source: 'Google (Playwright)',
        success: false,
        error: 'Playwright not available (serverless environment)',
      }
    }

    const page = await this.context!.newPage()

    try {
      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}&num=${numResults}`
      await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 15000 })

      // Wait for results
      await page.waitForSelector('div[data-sokoban-container], .g, #search', { timeout: 5000 }).catch(() => {})

      // Extract search results
      const results = await page.evaluate(() => {
        const snippets: string[] = []
        const urls: string[] = []

        // Try multiple selectors for Google results
        const resultSelectors = [
          'div[data-sokoban-container]',
          '.g',
          'div.g',
          '#search .g',
        ]

        for (const selector of resultSelectors) {
          const elements = document.querySelectorAll(selector)
          if (elements.length > 0) {
            elements.forEach(el => {
              const text = (el as HTMLElement).innerText
              if (text && text.length > 20) {
                snippets.push(text)
              }
              const links = el.querySelectorAll('a[href]')
              links.forEach(link => {
                const href = (link as HTMLAnchorElement).href
                if (href && href.startsWith('http') && !href.includes('google.com')) {
                  urls.push(href)
                }
              })
            })
            break
          }
        }

        return { snippets, urls }
      })

      return {
        text: results.snippets.join(' '),
        urls: results.urls,
        pageTitle: `Google Search: ${query}`,
        source: 'Google (Playwright)',
        success: true,
      }
    } catch (error) {
      return {
        text: '',
        urls: [],
        pageTitle: `Google Search: ${query}`,
        source: 'Google (Playwright)',
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }
    } finally {
      await page.close()
    }
  }

  async searchBing(query: string, numResults = 10): Promise<PlaywrightScrapeResult> {
    if (!this.isAvailable()) {
      await this.init()
    }

    if (!this.isAvailable()) {
      return {
        text: '',
        urls: [],
        pageTitle: `Bing Search: ${query}`,
        source: 'Bing (Playwright)',
        success: false,
        error: 'Playwright not available (serverless environment)',
      }
    }

    const page = await this.context!.newPage()

    try {
      const searchUrl = `https://www.bing.com/search?q=${encodeURIComponent(query)}&count=${numResults}`
      await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 15000 })

      await page.waitForSelector('.b_algo, li.b_algo', { timeout: 5000 }).catch(() => {})

      const results = await page.evaluate(() => {
        const snippets: string[] = []
        const urls: string[] = []

        const elements = document.querySelectorAll('.b_algo, li.b_algo')
        elements.forEach(el => {
          const text = (el as HTMLElement).innerText
          if (text && text.length > 20) {
            snippets.push(text)
          }
          const links = el.querySelectorAll('a[href]')
          links.forEach(link => {
            const href = (link as HTMLAnchorElement).href
            if (href && href.startsWith('http') && !href.includes('bing.com')) {
              urls.push(href)
            }
          })
        })

        return { snippets, urls }
      })

      return {
        text: results.snippets.join(' '),
        urls: results.urls,
        pageTitle: `Bing Search: ${query}`,
        source: 'Bing (Playwright)',
        success: true,
      }
    } catch (error) {
      return {
        text: '',
        urls: [],
        pageTitle: `Bing Search: ${query}`,
        source: 'Bing (Playwright)',
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }
    } finally {
      await page.close()
    }
  }

  async searchDuckDuckGo(query: string): Promise<PlaywrightScrapeResult> {
    if (!this.isAvailable()) {
      await this.init()
    }

    if (!this.isAvailable()) {
      return {
        text: '',
        urls: [],
        pageTitle: `DuckDuckGo Search: ${query}`,
        source: 'DuckDuckGo (Playwright)',
        success: false,
        error: 'Playwright not available (serverless environment)',
      }
    }

    const page = await this.context!.newPage()

    try {
      const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`
      await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 15000 })

      await page.waitForSelector('.result__snippet, .result__a', { timeout: 5000 }).catch(() => {})

      const results = await page.evaluate(() => {
        const snippets: string[] = []
        const urls: string[] = []

        const snippetsEl = document.querySelectorAll('.result__snippet')
        snippetsEl.forEach(el => {
          const text = (el as HTMLElement).innerText
          if (text && text.length > 10) {
            snippets.push(text)
          }
        })

        const links = document.querySelectorAll('.result__a')
        links.forEach(link => {
          const href = (link as HTMLAnchorElement).href
          if (href && href.startsWith('http') && !href.includes('duckduckgo.com')) {
            urls.push(href)
          }
        })

        return { snippets, urls }
      })

      return {
        text: results.snippets.join(' '),
        urls: results.urls,
        pageTitle: `DuckDuckGo Search: ${query}`,
        source: 'DuckDuckGo (Playwright)',
        success: true,
      }
    } catch (error) {
      return {
        text: '',
        urls: [],
        pageTitle: `DuckDuckGo Search: ${query}`,
        source: 'DuckDuckGo (Playwright)',
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }
    } finally {
      await page.close()
    }
  }

  async close() {
    if (this.context) {
      await this.context.close()
      this.context = null
    }
    if (this.browser) {
      await this.browser.close()
      this.browser = null
    }
  }
}

// Singleton instance
let scraperInstance: PlaywrightScraper | null = null

export async function getPlaywrightScraper(): Promise<PlaywrightScraper> {
  if (!scraperInstance) {
    scraperInstance = new PlaywrightScraper()
    await scraperInstance.init()
  }
  return scraperInstance
}

export async function closePlaywrightScraper() {
  if (scraperInstance) {
    await scraperInstance.close()
    scraperInstance = null
  }
}
