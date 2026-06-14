# OmniSearch - The Ultimate Search Browser

An AI-powered, multi-source search aggregator that combines results from Google, Bing, DuckDuckGo, Brave, Wikipedia, GitHub, StackOverflow, News, and Scholar — all in one beautiful interface.

## Features

- **Multi-Source Search**: Aggregate results from 10+ search engines simultaneously
- **AI-Powered Insights**: Automatic summarization and key point extraction
- **Advanced Filtering**: Filter by source, time range, content type, and more
- **Dark/Light Theme**: Beautiful UI with system-aware theming
- **Keyboard Shortcuts**: Power-user features for rapid navigation
- **Search History**: Track and revisit past searches
- **Bookmarks**: Save and organize important results
- **Privacy-First**: Local storage for history and bookmarks

## Tech Stack

- Next.js 15 (App Router)
- React 19
- TypeScript
- Tailwind CSS
- Radix UI Primitives
- AI SDK (OpenAI)
- Geist Font

## Getting Started

### Prerequisites

- Node.js 20+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd ultimate-search-browser

# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local
# Edit .env.local with your API keys

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `OPENAI_API_KEY` | OpenAI API key for AI summarization | Yes |
| `BRAVE_API_KEY` | Brave Search API key (optional, for real results) | No |

## Deployment

### Render

1. Push code to GitHub
2. Connect your GitHub repo to Render
3. Create a new Web Service
4. Set environment variables in Render dashboard

### Environment Variables for Production

```
OPENAI_API_KEY=your_openai_key
BRAVE_API_KEY=your_brave_key (optional)
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + K` | Focus search bar |
| `Enter` | Execute search |
| `↑ / ↓` | Navigate suggestions |
| `Esc` | Close panels |
| `Ctrl/Cmd + F` | Toggle filters |
| `Ctrl/Cmd + /` | Show shortcuts |

## License

MIT
