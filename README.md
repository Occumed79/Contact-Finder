# Ultra Search Browser

A Kagi-style broad search browser with multi-engine aggregation, query intelligence, signal scoring, and structured results — all without API keys.

## Features

- **Multi-Engine Aggregation**: Simultaneously scrapes DuckDuckGo, Bing, and Google for maximum coverage
- **Query Expansion Engine**: Auto-expands queries with synonyms, operators, and lens-specific terms
- **Search Lenses**: Web, PDF, Government, Procurement, Pricing, Technical, and News lenses
- **Signal Scoring**: Domain authority, document type, and content signals for relevance ranking
- **Intelligence Objects**: Structured results with organization, opportunity type, due dates, and confidence scores
- **Zero API Keys**: Uses cheerio + web scraping — no paid services required

## Advanced Features Roadmap

### Currently Active
- **Local BM25 Reranking**: In-memory BM25-style term frequency scoring for result relevance
- **Document Text Extraction**: HTML text extraction with entity recognition (emails, phones, URLs, dates, monetary values)
- **Intelligence Object Extraction**: Automatic extraction of structured data for procurement, provider, and pricing lenses

### Experimental / Scaffolded
- **Local Pseudo-Vector Reranking**: Hash-based TF-IDF vector approximation for semantic similarity (in-memory, not production-grade embeddings)
- **Procurement Crawlers**: HTTP fetch adapters for SAM.gov, BonfireHub, IonWave, PlanetBids, BidNetDirect (experimental mode with generic CSS selectors)
- **Document Extraction Scaffold**: PDF/DOCX text-processing functions assume pre-extracted text (no binary file parsing)

### Planned Next
- **pgvector Retrieval**: PostgreSQL pgvector extension for persistent vector storage and similarity search
- **PDF Binary Parsing**: Direct binary PDF file parsing without pre-extraction (requires pdf-parse or similar)
- **OCR (Optical Character Recognition)**: Text extraction from scanned documents and images (requires Tesseract.js or similar)
- **Production Embeddings**: Integration with production embedding models (OpenAI, Cohere, or local models)

*See Settings → Advanced Features for current capability status and runtime notes.*

## Tech Stack

- Next.js 15 (App Router)
- React 19 + TypeScript
- Tailwind CSS + Framer Motion
- Cheerio (server-side scraping)
- Radix UI Primitives
- Geist Font

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

**No API keys required.** The app uses web scraping and local algorithms.

## Deployment

### 1. Push to GitHub

```bash
git add .
git commit -m "Ready for deployment"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/ultimate-search-browser.git
git push -u origin main
```

### 2. Deploy to Render

1. Go to [render.com](https://render.com) → **New Web Service**
2. Connect your GitHub repo
3. Settings:
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Free
4. Click **Create Web Service**

Render will auto-deploy on every push to `main`.

### 3. Neon Database (Optional, Planned)

Future support for **pgvector-ready architecture** with persistent embeddings and true semantic/hybrid retrieval.

1. Go to [neon.tech](https://neon.tech) → Create Project
2. Copy the connection string
3. Add to Render as `DATABASE_URL` env var
4. Run:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```

**Why Neon?** Currently, vectors are scored in-memory. With Neon + pgvector, you get persistent embeddings and true semantic/hybrid retrieval.

## License

MIT
