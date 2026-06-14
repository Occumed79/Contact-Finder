export interface GeminiResult {
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

// Google Gemini API integration
// Uses Gemini to extract structured contact information from text
export async function searchGemini(query: string): Promise<GeminiResult> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return {
      text: '',
      urls: [],
      contacts: [],
      source: 'Gemini',
      success: false,
      error: 'GEMINI_API_KEY not configured',
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
        source: 'Gemini',
        success: false,
        error: 'No URLs found for query',
      }
    }

    // Scrape the top URL content
    let scrapedText = ''
    for (const url of urls.slice(0, 2)) {
      try {
        const res = await fetch(url, { signal: AbortSignal.timeout(5000) })
        if (res.ok) {
          const html = await res.text()
          const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').substring(0, 10000)
          scrapedText += text + ' '
        }
      } catch {
        // Continue to next URL
      }
    }

    if (scrapedText.length < 100) {
      return {
        text: '',
        urls,
        contacts: [],
        source: 'Gemini',
        success: false,
        error: 'Could not scrape enough content',
      }
    }

    // Use Gemini to extract contact information
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`
    
    const prompt = `Extract all contact information from the following text about "${query}". Return ONLY a JSON object with this exact structure:
{
  "emails": ["email1@example.com", "email2@example.com"],
  "phones": ["+1-555-123-4567", "+1-555-987-6543"],
  "linkedin_urls": ["https://linkedin.com/company/example"],
  "websites": ["https://example.com"]
}

Text to analyze:
${scrapedText.substring(0, 8000)}`

    const geminiResponse = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      }),
    })

    if (geminiResponse.status === 429) {
      return {
        text: scrapedText,
        urls,
        contacts: [],
        source: 'Gemini',
        success: false,
        error: 'Rate limited',
        rateLimited: true,
      }
    }

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text()
      throw new Error(`Gemini error: ${geminiResponse.status} - ${errorText}`)
    }

    const geminiData = await geminiResponse.json()
    
    // Extract the AI response
    const aiText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || ''
    
    // Parse the JSON response
    let extractedData: any = {}
    try {
      // Try to extract JSON from the response
      const jsonMatch = aiText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        extractedData = JSON.parse(jsonMatch[0])
      }
    } catch {
      // If JSON parsing fails, try regex extraction as fallback
    }

    const contacts: GeminiResult['contacts'] = []

    // Extract emails
    if (extractedData.emails && Array.isArray(extractedData.emails)) {
      extractedData.emails.forEach((email: string, i: number) => {
        if (email && !email.includes('@example.com')) {
          contacts.push({
            type: 'email',
            value: email,
            label: i === 0 ? 'Email' : `Email ${i + 1}`,
          })
        }
      })
    }

    // Extract phones
    if (extractedData.phones && Array.isArray(extractedData.phones)) {
      extractedData.phones.forEach((phone: string, i: number) => {
        if (phone) {
          contacts.push({
            type: 'phone',
            value: phone,
            label: i === 0 ? 'Phone' : `Phone ${i + 1}`,
          })
        }
      })
    }

    // Extract LinkedIn URLs
    if (extractedData.linkedin_urls && Array.isArray(extractedData.linkedin_urls)) {
      extractedData.linkedin_urls.forEach((linkedin: string, i: number) => {
        if (linkedin) {
          contacts.push({
            type: 'linkedin',
            value: linkedin,
            label: i === 0 ? 'LinkedIn' : `LinkedIn ${i + 1}`,
          })
        }
      })
    }

    // Extract websites
    if (extractedData.websites && Array.isArray(extractedData.websites)) {
      extractedData.websites.forEach((website: string, i: number) => {
        if (website && !website.includes('linkedin.com')) {
          contacts.push({
            type: 'website',
            value: website,
            label: i === 0 ? 'Website' : `Website ${i + 1}`,
          })
        }
      })
    }

    return {
      text: aiText,
      urls,
      contacts,
      source: 'Gemini',
      success: true,
    }
  } catch (error) {
    return {
      text: '',
      urls: [],
      contacts: [],
      source: 'Gemini',
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

// Alternative: Use Gemini directly with search context
export async function geminiDirectSearch(query: string): Promise<GeminiResult> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return {
      text: '',
      urls: [],
      contacts: [],
      source: 'Gemini Direct',
      success: false,
      error: 'GEMINI_API_KEY not configured',
    }
  }

  try {
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`
    
    const prompt = `You are a contact information extraction specialist. For the company "${query}", provide:
1. All email addresses you know
2. All phone numbers (with country codes)
3. LinkedIn company profile URL
4. Official website URL

Return ONLY a JSON object with this exact structure:
{
  "emails": ["email1@example.com", "email2@example.com"],
  "phones": ["+1-555-123-4567", "+1-555-987-6543"],
  "linkedin_url": "https://linkedin.com/company/example",
  "website": "https://example.com"
}

If you don't know certain information, leave those arrays empty or set to null.`

    const geminiResponse = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      }),
    })

    if (geminiResponse.status === 429) {
      return {
        text: '',
        urls: [],
        contacts: [],
        source: 'Gemini Direct',
        success: false,
        error: 'Rate limited',
        rateLimited: true,
      }
    }

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text()
      throw new Error(`Gemini error: ${geminiResponse.status} - ${errorText}`)
    }

    const geminiData = await geminiResponse.json()
    const aiText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || ''
    
    let extractedData: any = {}
    try {
      const jsonMatch = aiText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        extractedData = JSON.parse(jsonMatch[0])
      }
    } catch {
      // Fallback to regex extraction
    }

    const contacts: GeminiResult['contacts'] = []
    const urls: string[] = []

    if (extractedData.emails && Array.isArray(extractedData.emails)) {
      extractedData.emails.forEach((email: string, i: number) => {
        if (email && !email.includes('@example.com')) {
          contacts.push({
            type: 'email',
            value: email,
            label: i === 0 ? 'Email' : `Email ${i + 1}`,
          })
        }
      })
    }

    if (extractedData.phones && Array.isArray(extractedData.phones)) {
      extractedData.phones.forEach((phone: string, i: number) => {
        if (phone) {
          contacts.push({
            type: 'phone',
            value: phone,
            label: i === 0 ? 'Phone' : `Phone ${i + 1}`,
          })
        }
      })
    }

    if (extractedData.linkedin_url) {
      contacts.push({
        type: 'linkedin',
        value: extractedData.linkedin_url,
        label: 'LinkedIn',
      })
      urls.push(extractedData.linkedin_url)
    }

    if (extractedData.website) {
      contacts.push({
        type: 'website',
        value: extractedData.website,
        label: 'Website',
      })
      urls.push(extractedData.website)
    }

    return {
      text: aiText,
      urls,
      contacts,
      source: 'Gemini Direct',
      success: true,
    }
  } catch (error) {
    return {
      text: '',
      urls: [],
      contacts: [],
      source: 'Gemini Direct',
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}
