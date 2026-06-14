// ─── FEATURE CAPABILITY STATUS METADATA ───

export type FeatureStatus = 'active' | 'experimental' | 'scaffold' | 'planned'

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
    status: 'planned',
    runtimeEnabled: false,
    notes: 'Requires PostgreSQL with pgvector extension, database schema, and real embedding model integration.',
  },
  {
    id: 'document_text_extraction',
    label: 'Document Text Extraction',
    description: 'HTML text extraction with entity recognition',
    status: 'scaffold',
    runtimeEnabled: true,
    notes: 'HTML extraction with cheerio is functional. PDF/DOCX functions are text-processing scaffolds that assume pre-extracted text.',
  },
  {
    id: 'pdf_binary_parsing',
    label: 'PDF Binary Parsing',
    description: 'Direct binary PDF file parsing without pre-extraction',
    status: 'planned',
    runtimeEnabled: false,
    notes: 'Would require pdf-parse or similar library. Current implementation assumes text is already extracted.',
  },
  {
    id: 'ocr',
    label: 'OCR (Optical Character Recognition)',
    description: 'Text extraction from scanned documents and images',
    status: 'planned',
    runtimeEnabled: false,
    notes: 'Would require Tesseract.js or similar OCR library. Not currently implemented.',
  },
  {
    id: 'sam_gov_crawler',
    label: 'SAM.gov Crawler',
    description: 'Federal procurement opportunity crawler for SAM.gov',
    status: 'experimental',
    runtimeEnabled: true,
    notes: 'Attempts real HTTP fetch with 10s timeout. CSS selectors are generic and may not match actual site structure.',
  },
  {
    id: 'bonfire_crawler',
    label: 'BonfireHub Crawler',
    description: 'Procurement opportunity crawler for BonfireHub',
    status: 'experimental',
    runtimeEnabled: true,
    notes: 'Attempts real HTTP fetch with 10s timeout. CSS selectors are generic and may not match actual site structure.',
  },
  {
    id: 'ionwave_crawler',
    label: 'IonWave Crawler',
    description: 'Procurement opportunity crawler for IonWave',
    status: 'experimental',
    runtimeEnabled: true,
    notes: 'Attempts real HTTP fetch with 10s timeout. CSS selectors are generic and may not match actual site structure.',
  },
  {
    id: 'planetbids_crawler',
    label: 'PlanetBids Crawler',
    description: 'Procurement opportunity crawler for PlanetBids',
    status: 'experimental',
    runtimeEnabled: true,
    notes: 'Attempts real HTTP fetch with 10s timeout. CSS selectors are generic and may not match actual site structure.',
  },
  {
    id: 'bidnet_crawler',
    label: 'BidNetDirect Crawler',
    description: 'Procurement opportunity crawler for BidNetDirect',
    status: 'experimental',
    runtimeEnabled: true,
    notes: 'Attempts real HTTP fetch with 10s timeout. CSS selectors are generic and may not match actual site structure.',
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
