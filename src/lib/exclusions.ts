/**
 * Strong exclusion lists for contact extraction.
 * Also used by the learning layer to seed "known bad" patterns.
 */

export const JUNK_EMAIL_LOCAL = new Set([
  'noreply', 'no-reply', 'donotreply', 'do-not-reply', 'mailer-daemon',
  'postmaster', 'webmaster', 'hostmaster', 'abuse', 'spam', 'privacy',
  'newsletter', 'marketing', 'unsubscribe', 'bounce', 'daemon',
  'notifications', 'alert', 'alerts', 'system', 'root',
  'test', 'example', 'demo', 'sample', 'user', 'null', 'undefined',
  'mailer', 'auto', 'automated', 'bot', 'crawler',
])

export const JUNK_EMAIL_DOMAINS = new Set([
  'example.com', 'example.org', 'example.net', 'test.com', 'test.org',
  'localhost', 'domain.com', 'email.com', 'yourdomain.com', 'company.com',
  'sentry.io', 'wixpress.com', 'squarespace.com', 'godaddy.com',
  'cloudflare.com', 'googleusercontent.com', 'gstatic.com',
  'schema.org', 'w3.org', 'jquery.com', 'github.com', 'githubusercontent.com',
  'linkedin.com', 'facebook.com', 'twitter.com', 'x.com', 'instagram.com',
  'youtube.com', 'google.com', 'bing.com', 'duckduckgo.com',
  'mailchimp.com', 'sendgrid.net', 'mandrillapp.com', 'amazonaws.com',
  'gravatar.com', 'wordpress.com', 'blogger.com', 'medium.com',
  'sentry-next.wixpress.com', '2x.wixstatic.com',
  'placeholder.com', 'yoursite.com', 'mysite.com',
])

export const IMAGE_EXTENSIONS = /\.(png|jpe?g|gif|svg|webp|ico|bmp|tiff?)(\?|$)/i
export const TRACKING_PATTERNS = /utm_|pixel|tracker|beacon|analytics|doubleclick|googlesyndication/i

/** Domains that should never appear as "company website" contact results */
export const BLOCKED_HOSTS = [
  'google.com', 'bing.com', 'duckduckgo.com', 'yahoo.com',
  'linkedin.com', 'facebook.com', 'twitter.com', 'x.com',
  'youtube.com', 'instagram.com', 'wikipedia.org',
  'crunchbase.com', 'bloomberg.com', 'reuters.com',
  'serper.dev', 'serpapi.com', 'apify.com', 'firecrawl.dev',
]

export function isJunkEmail(email: string): boolean {
  const lower = email.toLowerCase().trim()
  if (IMAGE_EXTENSIONS.test(lower)) return true
  if (TRACKING_PATTERNS.test(lower)) return true

  const at = lower.lastIndexOf('@')
  if (at < 1) return true
  const local = lower.slice(0, at)
  const domain = lower.slice(at + 1)

  if (local.length < 2 || domain.length < 4) return true
  if (JUNK_EMAIL_LOCAL.has(local)) return true
  if (JUNK_EMAIL_DOMAINS.has(domain)) return true
  if (domain.endsWith('.png') || domain.endsWith('.jpg') || domain.endsWith('.gif')) return true
  if (local.includes('/') || local.includes('?') || domain.includes('/')) return true
  if (local.length > 40 && !/[._-]/.test(local)) return true
  // Generic role accounts that are almost never useful without domain match
  if (/^(info|contact|hello|support|sales|admin|hr|careers|press)(\+.*)?$/.test(local) === false) {
    // keep named emails; role accounts handled by relevance later
  }
  return false
}

export function normalizeDomainHints(query: string): string[] {
  const cleaned = query
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  const parts = cleaned.split(' ').filter(p => p.length > 2)
  const joined = parts.join('')
  const hyphen = parts.join('-')
  return [...new Set([joined, hyphen, ...parts].filter(Boolean))]
}

export function emailMatchesOrg(email: string, query: string): boolean {
  const domain = email.toLowerCase().split('@')[1] || ''
  const hints = normalizeDomainHints(query)
  if (hints.some(h => domain.includes(h) || h.includes(domain.split('.')[0]))) {
    return true
  }
  const qTokens = query.toLowerCase().split(/\W+/).filter(t => t.length > 3)
  return qTokens.some(t => domain.includes(t) || email.toLowerCase().includes(t))
}
