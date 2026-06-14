// ─── EMBEDDING SERVICE (Local with @xenova/transformers) ───

import { pipeline } from '@xenova/transformers'

let embeddingPipeline: any = null
let isInitializing = false

/**
 * Initialize the embedding pipeline (lazy loading)
 * Uses a lightweight sentence transformer model
 */
export async function initializeEmbeddings(): Promise<void> {
  if (embeddingPipeline !== null) {
    return
  }
  
  if (isInitializing) {
    // Wait for existing initialization
    while (isInitializing) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    return
  }
  
  isInitializing = true
  
  try {
    // Use a lightweight sentence transformer model
    // 'Xenova/all-MiniLM-L6-v2' is a good balance of speed and quality
    embeddingPipeline = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2')
    console.log('Embedding pipeline initialized with Xenova/all-MiniLM-L6-v2')
  } catch (err) {
    console.error('Failed to initialize embedding pipeline:', err)
    throw err
  } finally {
    isInitializing = false
  }
}

/**
 * Generate embedding for a single text
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  if (!embeddingPipeline) {
    await initializeEmbeddings()
  }
  
  if (!embeddingPipeline) {
    throw new Error('Embedding pipeline not available')
  }
  
  try {
    const output = await embeddingPipeline(text, {
      pooling: 'mean',
      normalize: true,
    })
    
    // Convert to array with proper type casting
    const embedding = Array.from(output.data) as number[]
    return embedding
  } catch (err) {
    console.error('Failed to generate embedding:', err)
    throw err
  }
}

/**
 * Generate embeddings for multiple texts (batch processing)
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const embeddings: number[][] = []
  
  for (const text of texts) {
    const embedding = await generateEmbedding(text)
    embeddings.push(embedding)
  }
  
  return embeddings
}

/**
 * Calculate cosine similarity between two embeddings
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Embeddings must have the same length')
  }
  
  let dotProduct = 0
  let magnitudeA = 0
  let magnitudeB = 0
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i]
    magnitudeA += a[i] * a[i]
    magnitudeB += b[i] * b[i]
  }
  
  magnitudeA = Math.sqrt(magnitudeA)
  magnitudeB = Math.sqrt(magnitudeB)
  
  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0
  }
  
  return dotProduct / (magnitudeA * magnitudeB)
}

/**
 * Check if embeddings are available
 */
export function isEmbeddingsReady(): boolean {
  return embeddingPipeline !== null
}
