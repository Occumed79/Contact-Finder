import * as cheerio from 'cheerio'
import pdfParse from 'pdf-parse'
import Tesseract from 'tesseract.js'
import mammoth from 'mammoth'

// ─── DOCUMENT EXTRACTION LAYER ───
// SERVER-SIDE ONLY: This module must only be imported in server-side code (API routes, server components)
// Do not import this in client components or it will bundle heavy dependencies.

export interface ExtractedDocument {
  text: string
  title?: string
  metadata: {
    fileType?: string
    pageCount?: number
    author?: string
    createdDate?: string
    modifiedDate?: string
    ocrConfidence?: number
  }
  entities: {
    emails: string[]
    phones: string[]
    urls: string[]
    dates: string[]
    monetaryValues: string[]
  }
  sections: {
    headers: string[]
    paragraphs: string[]
    tables: string[][]
  }
}

export interface ExtractionResult {
  success: boolean
  document?: ExtractedDocument
  error?: string
  source?: string
}

/**
 * Extract text from HTML content
 */
export function extractFromHTML(html: string): ExtractedDocument {
  const $ = cheerio.load(html)
  
  // Remove script/style elements
  $('script, style, nav, header, footer, iframe').remove()
  
  const text = $('body').text().replace(/\s+/g, ' ').trim()
  const title = $('title').text().trim() || $('h1').first().text().trim()
  
  // Extract sections
  const headers: string[] = []
  $('h1, h2, h3, h4, h5, h6').each((_, el) => {
    const header = $(el).text().trim()
    if (header) headers.push(header)
  })
  
  const paragraphs: string[] = []
  $('p').each((_, el) => {
    const para = $(el).text().trim()
    if (para.length > 20) paragraphs.push(para)
  })
  
  const tables: string[][] = []
  $('table').each((_, el) => {
    const tableData: string[] = []
    $(el).find('td, th').each((_, cell) => {
      tableData.push($(cell).text().trim())
    })
    if (tableData.length > 0) tables.push(tableData)
  })
  
  // Extract entities
  const entities = extractEntities(text)
  
  return {
    text,
    title,
    metadata: { fileType: 'html' },
    entities,
    sections: { headers, paragraphs, tables },
  }
}

/**
 * Extract entities from text
 */
export function extractEntities(text: string) {
  const emails = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || []
  
  const phones = text.match(new RegExp('(?:phone|tel|call)[:\\s]*\\d[\\d\\s]*)?(\\+?1?\\d[\\d\\s]*)', 'gi')) || []
  
  const urls = text.match(/https?:\/\/(?:www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\/[a-zA-Z0-9-._~:/?#[\]@!$&'()*+,;=]*)?/g) || []
  
  const dates = text.match(
    /(?:\d{1,2}\/\d{1,2}\/\d{4})|(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}/gi
  ) || []
  
  const monetaryValues = text.match(/\$[\d,]+(?:\.\d{2})?|\$\d+\s*(?:million|k|K)/gi) || []
  
  return {
    emails: [...new Set(emails)],
    phones: [...new Set(phones)],
    urls: [...new Set(urls)],
    dates: [...new Set(dates)],
    monetaryValues: [...new Set(monetaryValues)],
  }
}

/**
 * Extract structured data from PDF binary data using pdf-parse
 */
export async function extractFromPDFBuffer(buffer: Buffer): Promise<ExtractionResult> {
  try {
    const data = await pdfParse(buffer)
    const text = data.text.replace(/\s+/g, ' ').trim()
    
    // Try to extract title from first few lines
    const lines = text.split('\n').filter((l: string) => l.trim())
    const title = lines[0]?.trim() || undefined
    
    // Extract sections based on common patterns
    const headers: string[] = []
    const headerPatterns = [
      /^(?:Chapter|Section|Part)\s+\d+/i,
      /^[A-Z][A-Z\s]{10,}$/,
      /^\d+\.\s+[A-Z]/,
    ]
    
    lines.forEach((line: string) => {
      for (const pattern of headerPatterns) {
        if (pattern.test(line)) {
          headers.push(line.trim())
          break
        }
      }
    })
    
    const paragraphs: string[] = []
    let currentPara = ''
    lines.forEach((line: string) => {
      if (line.trim().length === 0) {
        if (currentPara.length > 50) {
          paragraphs.push(currentPara.trim())
          currentPara = ''
        }
      } else {
        currentPara += line + ' '
      }
    })
    if (currentPara.length > 50) paragraphs.push(currentPara.trim())
    
    const entities = extractEntities(text)
    
    return {
      success: true,
      document: {
        text,
        title,
        metadata: {
          fileType: 'pdf',
          pageCount: data.numpages,
          author: data.info?.Author,
          createdDate: data.info?.CreationDate,
          modifiedDate: data.info?.ModDate,
        },
        entities,
        sections: { headers, paragraphs, tables: [] },
      },
    }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'PDF parsing failed',
    }
  }
}

/**
 * Extract structured data from PDF text (fallback for pre-extracted text)
 */
export function extractFromPDFText(pdfText: string, metadata?: any): ExtractedDocument {
  const text = pdfText.replace(/\s+/g, ' ').trim()
  
  // Try to extract title from first few lines
  const lines = text.split('\n').filter(l => l.trim())
  const title = lines[0]?.trim() || undefined
  
  // Extract sections based on common patterns
  const headers: string[] = []
  const headerPatterns = [
    /^(?:Chapter|Section|Part)\s+\d+/i,
    /^[A-Z][A-Z\s]{10,}$/,
    /^\d+\.\s+[A-Z]/,
  ]
  
  lines.forEach(line => {
    for (const pattern of headerPatterns) {
      if (pattern.test(line)) {
        headers.push(line.trim())
        break
      }
    }
  })
  
  const paragraphs: string[] = []
  let currentPara = ''
  lines.forEach(line => {
    if (line.trim().length === 0) {
      if (currentPara.length > 50) {
        paragraphs.push(currentPara.trim())
        currentPara = ''
      }
    } else {
      currentPara += line + ' '
    }
  })
  if (currentPara.length > 50) paragraphs.push(currentPara.trim())
  
  const entities = extractEntities(text)
  
  return {
    text,
    title,
    metadata: {
      fileType: 'pdf',
      pageCount: metadata?.numPages || undefined,
      author: metadata?.info?.Author,
      createdDate: metadata?.info?.CreationDate,
      modifiedDate: metadata?.info?.ModDate,
    },
    entities,
    sections: { headers, paragraphs, tables: [] },
  }
}

/**
 * Extract from DOCX using mammoth (binary parsing)
 */
export async function extractFromDOCXBuffer(buffer: Buffer, timeout = 10000): Promise<ExtractionResult> {
  try {
    // Add timeout for DOCX parsing
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('DOCX parsing timeout')), timeout)
    )
    
    const result = await Promise.race([
      mammoth.extractRawText({ buffer }),
      timeoutPromise,
    ])
    const text = result.value.replace(/\s+/g, ' ').trim()
    
    if (text.length < 10) {
      return {
        success: false,
        error: 'DOCX extraction returned insufficient text',
      }
    }
    
    const lines = text.split('\n').filter((l: string) => l.trim())
    const title = lines[0]?.trim() || undefined
    
    const headers: string[] = []
    lines.forEach((line: string) => {
      if (/^[A-Z][A-Z\s]{8,}$/.test(line) || /^\d+\.\s+[A-Z]/.test(line)) {
        headers.push(line.trim())
      }
    })
    
    const paragraphs: string[] = []
    let currentPara = ''
    lines.forEach((line: string) => {
      if (line.trim().length === 0) {
        if (currentPara.length > 30) {
          paragraphs.push(currentPara.trim())
          currentPara = ''
        }
      } else {
        currentPara += line + ' '
      }
    })
    if (currentPara.length > 30) paragraphs.push(currentPara.trim())
    
    const entities = extractEntities(text)
    
    return {
      success: true,
      document: {
        text,
        title,
        metadata: {
          fileType: 'docx',
        },
        entities,
        sections: { headers, paragraphs, tables: [] },
      },
    }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'DOCX parsing failed',
    }
  }
}

/**
 * Extract from DOCX text (fallback for pre-extracted text)
 */
export function extractFromDOCXText(docxContent: string): ExtractedDocument {
  const text = docxContent.replace(/\s+/g, ' ').trim()
  
  const lines = text.split('\n').filter((l: string) => l.trim())
  const title = lines[0]?.trim() || undefined
  
  const headers: string[] = []
  lines.forEach((line: string) => {
    if (/^[A-Z][A-Z\s]{8,}$/.test(line) || /^\d+\.\s+[A-Z]/.test(line)) {
      headers.push(line.trim())
    }
  })
  
  const paragraphs: string[] = []
  let currentPara = ''
  lines.forEach((line: string) => {
    if (line.trim().length === 0) {
      if (currentPara.length > 30) {
        paragraphs.push(currentPara.trim())
        currentPara = ''
      }
    } else {
      currentPara += line + ' '
    }
  })
  if (currentPara.length > 30) paragraphs.push(currentPara.trim())
  
  const entities = extractEntities(text)
  
  return {
    text,
    title,
    metadata: { fileType: 'docx' },
    entities,
    sections: { headers, paragraphs, tables: [] },
  }
}

/**
 * Check if OCR is enabled via environment variable
 */
export function isOCREnabled(): boolean {
  return process.env.ENABLE_OCR === 'true'
}

/**
 * Extract text from image using OCR (Tesseract.js)
 * Only runs if ENABLE_OCR=true env var is set
 */
export async function extractFromImage(imageBuffer: Buffer, timeout = 30000): Promise<ExtractionResult> {
  // Check if OCR is enabled
  if (!isOCREnabled()) {
    console.log('OCR disabled via ENABLE_OCR env var, skipping image extraction')
    return {
      success: false,
      error: 'OCR is disabled. Set ENABLE_OCR=true to enable.',
    }
  }
  
  try {
    const worker = await Tesseract.createWorker('eng', 1, {
      logger: (m: any) => {
        if (m.status === 'recognizing text') {
          console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`)
        }
      },
    })
    
    // Add timeout for OCR operation
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('OCR operation timeout')), timeout)
    )
    
    const result = await Promise.race([
      worker.recognize(imageBuffer),
      timeoutPromise,
    ])
    await worker.terminate()
    
    const text = result.data.text.replace(/\s+/g, ' ').trim()
    
    if (text.length < 10) {
      return {
        success: false,
        error: 'OCR returned insufficient text',
      }
    }
    
    const lines = text.split('\n').filter((l: string) => l.trim())
    const title = lines[0]?.trim() || undefined
    
    const entities = extractEntities(text)
    
    return {
      success: true,
      document: {
        text,
        title,
        metadata: {
          fileType: 'image',
          ocrConfidence: result.data.confidence,
        },
        entities,
        sections: {
          headers: [],
          paragraphs: lines.filter((l: string) => l.length > 20),
          tables: [],
        },
      },
    }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'OCR processing failed',
    }
  }
}

/**
 * Fetch and extract from a URL with timeout
 */
export async function fetchAndExtractFromURL(url: string, timeout = 10000): Promise<ExtractionResult> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeout)
  
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      signal: controller.signal,
    })
    clearTimeout(timer)
    
    if (!res.ok) {
      return {
        success: false,
        error: `HTTP ${res.status}: ${res.statusText}`,
        source: url,
      }
    }
    
    const contentType = res.headers.get('content-type') || ''
    
    // Handle PDF
    if (contentType.includes('application/pdf') || url.toLowerCase().endsWith('.pdf')) {
      const buffer = Buffer.from(await res.arrayBuffer())
      return await extractFromPDFBuffer(buffer)
    }
    
    // Handle DOCX
    if (contentType.includes('application/vnd.openxmlformats-officedocument.wordprocessingml.document') || url.toLowerCase().endsWith('.docx')) {
      const buffer = Buffer.from(await res.arrayBuffer())
      return await extractFromDOCXBuffer(buffer)
    }
    
    // Handle images (OCR)
    if (contentType.includes('image/') || /\.(png|jpg|jpeg|gif|bmp|tiff|webp)$/i.test(url)) {
      const buffer = Buffer.from(await res.arrayBuffer())
      return await extractFromImage(buffer, timeout)
    }
    
    // Handle HTML
    const html = await res.text()
    const document = extractFromHTML(html)
    return {
      success: true,
      document,
      source: url,
    }
  } catch (err) {
    clearTimeout(timer)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Fetch failed',
      source: url,
    }
  }
}

/**
 * Main extraction router
 */
export async function extractDocument(
  content: string,
  fileType: 'html' | 'pdf' | 'docx' | 'text',
  metadata?: any
): Promise<ExtractedDocument> {
  switch (fileType) {
    case 'html':
      return extractFromHTML(content)
    case 'pdf':
      return extractFromPDFText(content, metadata)
    case 'docx':
      return extractFromDOCXText(content)
    case 'text':
      return {
        text: content.replace(/\s+/g, ' ').trim(),
        metadata: { fileType: 'text' },
        entities: extractEntities(content),
        sections: { headers: [], paragraphs: [content], tables: [] },
      }
    default:
      return {
        text: content,
        metadata: { fileType: 'unknown' },
        entities: extractEntities(content),
        sections: { headers: [], paragraphs: [], tables: [] },
      }
  }
}

/**
 * Score document relevance based on query and extracted content
 */
export function scoreDocumentRelevance(
  document: ExtractedDocument,
  query: string,
  lens: string
): number {
  const queryTerms = query.toLowerCase().split(/\s+/)
  const text = document.text.toLowerCase()
  
  let score = 0
  
  // Term matching
  queryTerms.forEach(term => {
    const regex = new RegExp(term, 'gi')
    const matches = text.match(regex)
    if (matches) {
      score += matches.length * 5
    }
  })
  
  // Title bonus
  if (document.title) {
    const titleLower = document.title.toLowerCase()
    queryTerms.forEach(term => {
      if (titleLower.includes(term)) score += 20
    })
  }
  
  // Entity bonuses based on lens
  if (lens === 'procurement') {
    if (document.entities.dates.length > 0) score += 15
    if (document.entities.monetaryValues.length > 0) score += 15
    if (text.includes('rfp') || text.includes('solicitation')) score += 30
  }
  
  if (lens === 'pricing') {
    if (document.entities.monetaryValues.length > 0) score += 25
    if (text.includes('fee') || text.includes('price') || text.includes('rate')) score += 20
  }
  
  if (lens === 'provider') {
    if (document.entities.phones.length > 0) score += 15
    if (document.entities.emails.length > 0) score += 10
    if (text.includes('clinic') || text.includes('provider')) score += 20
  }
  
  // Section structure bonus
  if (document.sections.headers.length > 3) score += 10
  if (document.sections.tables.length > 0) score += 15
  
  return Math.min(100, score)
}
