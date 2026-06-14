// ─── FEATURE CAPABILITY STATUS METADATA ───

export type FeatureStatus = 'active' | 'experimental' | 'scaffold' | 'planned' | 'blocked'

export interface FeatureCapability {
  id: string
  label: string
  description: string
  status: FeatureStatus
  runtimeEnabled: boolean
  notes: string
}

export const FEATURE_CAPABILITIES: FeatureCapability[] = [
  {
    id: 'local_bm25_reranking',
    label: 'Local BM25 Reranking',
    description: 'BM25-style term frequency scoring for result relevance',
    status: 'active',
    runtimeEnabled: true,
    notes: 'In-memory BM25 implementation with configurable k1 and b parameters',
  },
  {
    id: 'local_pseudo_vector_reranking',
    label: 'Local Pseudo-Vector Reranking',
    description: 'Hash-based TF-IDF vector approximation for semantic similarity',
    status: 'experimental',
    runtimeEnabled: true,
    notes: 'In-memory cosine similarity on 128-dim hash-based embeddings. Not production-grade embeddings.',
  },
  {
    id: 'pgvector_retrieval',
    label: 'pgvector Retrieval',
    description: 'PostgreSQL pgvector extension for persistent vector storage and similarity search',
    status: 'active',
    runtimeEnabled: true,
    notes: 'Implemented with pg library. Requires DATABASE_URL and PostgreSQL with pgvector extension. Automatic schema initialization on first use.',
  },
  {
    id: 'embedding_model',
    label: 'Local Embedding Model',
    description: 'Local sentence transformer model for generating text embeddings',
    status: 'active',
    runtimeEnabled: true,
    notes: 'Implemented with @xenova/transformers using Xenova/all-MiniLM-L6-v2 model. Runs entirely in-browser/server-side without API keys.',
  },
  {
    id: 'document_text_extraction',
    label: 'Document Text Extraction',
    description: 'HTML, PDF, DOCX, and image text extraction with entity recognition',
    status: 'active',
    runtimeEnabled: true,
    notes: 'HTML extraction with cheerio, PDF binary parsing with pdf-parse, DOCX with mammoth, OCR with Tesseract.js.',
  },
  {
    id: 'pdf_binary_parsing',
    label: 'PDF Binary Parsing',
    description: 'Direct binary PDF file parsing using pdf-parse',
    status: 'active',
    runtimeEnabled: true,
    notes: 'Implemented with pdf-parse library. Extracts text, metadata, and page count from binary PDF files.',
  },
  {
    id: 'docx_binary_parsing',
    label: 'DOCX Binary Parsing',
    description: 'Direct binary DOCX file parsing using mammoth',
    status: 'active',
    runtimeEnabled: true,
    notes: 'Implemented with mammoth library. Extracts text from DOCX files.',
  },
  {
    id: 'ocr',
    label: 'OCR (Optical Character Recognition)',
    description: 'Text extraction from scanned documents and images',
    status: 'active',
    runtimeEnabled: true,
    notes: 'Implemented with Tesseract.js. Extracts text from images with confidence scoring.',
  },
  {
    id: 'sam_gov_crawler',
    label: 'SAM.gov Crawler',
    description: 'Federal procurement opportunity crawler for SAM.gov',
    status: 'experimental',
    runtimeEnabled: true,
    notes: 'Attempts real HTTP fetch with 10s timeout. May be blocked by bot detection. Returns diagnostics.',
  },
  {
    id: 'bonfire_crawler',
    label: 'BonfireHub Crawler',
    description: 'Procurement opportunity crawler for BonfireHub',
    status: 'experimental',
    runtimeEnabled: true,
    notes: 'Attempts real HTTP fetch with 10s timeout. May be blocked by bot detection. Returns diagnostics.',
  },
  {
    id: 'ionwave_crawler',
    label: 'IonWave Crawler',
    description: 'Procurement opportunity crawler for IonWave',
    status: 'experimental',
    runtimeEnabled: true,
    notes: 'Attempts real HTTP fetch with 10s timeout. May be blocked by bot detection. Returns diagnostics.',
  },
  {
    id: 'planetbids_crawler',
    label: 'PlanetBids Crawler',
    description: 'Procurement opportunity crawler for PlanetBids',
    status: 'experimental',
    runtimeEnabled: true,
    notes: 'Attempts real HTTP fetch with 10s timeout. May be blocked by bot detection. Returns diagnostics.',
  },
  {
    id: 'bidnet_crawler',
    label: 'BidNetDirect Crawler',
    description: 'Procurement opportunity crawler for BidNetDirect',
    status: 'experimental',
    runtimeEnabled: true,
    notes: 'Attempts real HTTP fetch with 10s timeout. May be blocked by bot detection. Returns diagnostics.',
  },
]

export function getFeatureCapability(id: string): FeatureCapability | undefined {
  return FEATURE_CAPABILITIES.find(cap => cap.id === id)
}

export function getFeaturesByStatus(status: FeatureStatus): FeatureCapability[] {
  return FEATURE_CAPABILITIES.filter(cap => cap.status === status)
}

export function getRuntimeEnabledFeatures(): FeatureCapability[] {
  return FEATURE_CAPABILITIES.filter(cap => cap.runtimeEnabled)
}
