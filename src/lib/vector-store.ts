// ─── VECTOR STORE INTERFACE ───

export interface SearchDocument {
  id: string
  text: string
  embedding?: number[]
  metadata: {
    url?: string
    title?: string
    source?: string
    lens?: string
    [key: string]: any
  }
}

export interface VectorStoreAdapter {
  addDocument(document: SearchDocument): Promise<void>
  addDocuments(documents: SearchDocument[]): Promise<void>
  search(query: string, topK?: number): Promise<SearchDocument[]>
  searchByVector(vector: number[], topK?: number): Promise<SearchDocument[]>
  deleteDocument(id: string): Promise<void>
  clear(): Promise<void>
}

// ─── LOCAL VECTOR STORE ADAPTER (In-Memory) ───

export class LocalVectorStoreAdapter implements VectorStoreAdapter {
  private documents: Map<string, SearchDocument>
  private embeddings: Map<string, number[]>
  
  constructor() {
    this.documents = new Map()
    this.embeddings = new Map()
  }
  
  async addDocument(document: SearchDocument): Promise<void> {
    this.documents.set(document.id, document)
    if (document.embedding) {
      this.embeddings.set(document.id, document.embedding)
    }
  }
  
  async addDocuments(documents: SearchDocument[]): Promise<void> {
    for (const doc of documents) {
      await this.addDocument(doc)
    }
  }
  
  async search(query: string, topK = 10): Promise<SearchDocument[]> {
    // Simple text-based search for local adapter
    const queryTerms = query.toLowerCase().split(/\s+/)
    const scored: { doc: SearchDocument; score: number }[] = []
    
    this.documents.forEach((doc) => {
      const text = doc.text.toLowerCase()
      let score = 0
      
      queryTerms.forEach(term => {
        const regex = new RegExp(term, 'gi')
        const matches = text.match(regex)
        if (matches) {
          score += matches.length
        }
      })
      
      if (score > 0) {
        scored.push({ doc, score })
      }
    })
    
    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .map(s => s.doc)
  }
  
  async searchByVector(vector: number[], topK = 10): Promise<SearchDocument[]> {
    const scored: { doc: SearchDocument; similarity: number }[] = []
    
    this.documents.forEach((doc) => {
      const docEmbedding = this.embeddings.get(doc.id)
      if (docEmbedding) {
        const similarity = this.cosineSimilarity(vector, docEmbedding)
        scored.push({ doc, similarity })
      }
    })
    
    return scored
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK)
      .map(s => s.doc)
  }
  
  async deleteDocument(id: string): Promise<void> {
    this.documents.delete(id)
    this.embeddings.delete(id)
  }
  
  async clear(): Promise<void> {
    this.documents.clear()
    this.embeddings.clear()
  }
  
  private cosineSimilarity(vec1: number[], vec2: number[]): number {
    if (vec1.length !== vec2.length) return 0
    
    let dotProduct = 0
    let magnitude1 = 0
    let magnitude2 = 0
    
    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i]
      magnitude1 += vec1[i] * vec1[i]
      magnitude2 += vec2[i] * vec2[i]
    }
    
    magnitude1 = Math.sqrt(magnitude1)
    magnitude2 = Math.sqrt(magnitude2)
    
    if (magnitude1 === 0 || magnitude2 === 0) return 0
    
    return dotProduct / (magnitude1 * magnitude2)
  }
}

// ─── PGVECTOR STORE ADAPTER (Planned - Not Implemented) ───

export class PgVectorStoreAdapter implements VectorStoreAdapter {
  constructor(connectionString: string) {
    throw new Error('PgVectorStoreAdapter is not implemented. Requires PostgreSQL with pgvector extension and database schema.')
  }
  
  async addDocument(document: SearchDocument): Promise<void> {
    throw new Error('Not implemented')
  }
  
  async addDocuments(documents: SearchDocument[]): Promise<void> {
    throw new Error('Not implemented')
  }
  
  async search(query: string, topK?: number): Promise<SearchDocument[]> {
    throw new Error('Not implemented')
  }
  
  async searchByVector(vector: number[], topK?: number): Promise<SearchDocument[]> {
    throw new Error('Not implemented')
  }
  
  async deleteDocument(id: string): Promise<void> {
    throw new Error('Not implemented')
  }
  
  async clear(): Promise<void> {
    throw new Error('Not implemented')
  }
}

// ─── VECTOR STORE FACTORY ───

export function createVectorStoreAdapter(type: 'local' | 'pgvector', connectionString?: string): VectorStoreAdapter {
  switch (type) {
    case 'local':
      return new LocalVectorStoreAdapter()
    case 'pgvector':
      if (!connectionString) {
        throw new Error('PgVector requires DATABASE_URL connection string')
      }
      return new PgVectorStoreAdapter(connectionString)
    default:
      throw new Error(`Unknown vector store type: ${type}`)
  }
}
