# Contact Intelligence — Vertical Search Platform

A search intelligence platform with query expansion, signal scoring, and vertical routing. Scrapes DuckDuckGo/Bing/Google with zero API keys required.

## Features

- **Query Expansion Engine**: Auto-expands queries with synonyms and search operators
- **Vertical Search Routing**: Contact, Procurement, Provider, and Pricing lenses
- **Signal Scoring**: Domain authority, document type, and content signals
- **Intelligence Objects**: Structured results with confidence scores
- **Web Scraping**: Zero API keys — uses cheerio + DuckDuckGo
- **Spy-Grade UI**: Matrix rain, radar, globe visualization, glassmorphism

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

### 3. Neon Database (Optional)

Only needed if you want **semantic search with embeddings** (pgvector).

1. Go to [neon.tech](https://neon.tech) → Create Project
2. Copy the connection string
3. Add to Render as `DATABASE_URL` env var
4. Run:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```

**Why Neon?** Without a database, results are scored in-memory. With Neon + pgvector, you get persistent embeddings and true semantic/hybrid retrieval.

## License

MIT
