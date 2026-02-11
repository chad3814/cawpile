# Cawpile Video Generator

Remotion-based video generator for creating TikTok-style monthly reading recap videos from Cawpile book data.

## Features

- **Kinetic Typography**: Bold, animated text reveals for month names and stats
- **Book Reveals**: Animated cover slides with typewriter titles and rating counters
- **Stats Dashboard**: Animated counters for books read, pages, and ratings
- **Coming Soon**: Teases currently reading books with progress bars
- **Dark Theme**: Moody aesthetic with orange accents

## Setup

```bash
# Install dependencies
npm install

# Start Remotion Studio for preview/development
npm run dev

# Start the render server
npm run server
```

## Scripts

- `npm run dev` - Start Remotion Studio for preview and editing
- `npm run build` - Bundle the project
- `npm run render` - Render the default composition to MP4
- `npm run server` - Start the Express render server on port 3001

## API

### POST /render

Accepts `MonthlyRecapExport` JSON and renders an MP4 video.

```bash
curl -X POST http://localhost:3001/render \
  -H "Content-Type: application/json" \
  -d @sample-data.json
```

Response:
```json
{
  "success": true,
  "filename": "recap-2025-01-1706123456789.mp4",
  "path": "/path/to/out/recap-2025-01-1706123456789.mp4",
  "duration": 18.5,
  "renderTime": "12.3"
}
```

### GET /download/:filename

Download a rendered video file.

### GET /videos

List all rendered videos in the output directory.

### GET /health

Health check endpoint.

## Data Format

The render endpoint expects data in `MonthlyRecapExport` format:

```typescript
interface MonthlyRecapExport {
  meta: {
    month: number      // 1-12
    year: number
    monthName: string  // "January"
    generatedAt: string
  }
  books: Array<{
    id: string
    title: string
    authors: string[]
    coverUrl: string | null
    status: 'COMPLETED' | 'DNF'
    finishDate: string
    rating: {
      average: number
      characters: number | null
      atmosphere: number | null
      writing: number | null
      plot: number | null
      intrigue: number | null
      logic: number | null
      enjoyment: number | null
    } | null
    pageCount: number | null
  }>
  currentlyReading: Array<{
    id: string
    title: string
    authors: string[]
    coverUrl: string | null
    progress: number
  }>
  stats: {
    totalBooks: number
    completedCount: number
    dnfCount: number
    totalPages: number
    averageRating: number | null
    topRatedBook: { ... } | null
    lowestRatedBook: { ... } | null
  }
}
```

## Video Specs

- **Resolution**: 1080x1920 (9:16 portrait for TikTok/Reels)
- **Frame Rate**: 30fps
- **Codec**: H.264

## Timing

The video duration is calculated dynamically based on content:
- Intro: 2.5 seconds
- Per book: 3 seconds
- Stats: 4 seconds
- Coming Soon: 3 seconds (only if currently reading books exist)
- Outro: 2 seconds

## Development

Edit compositions in `src/compositions/MonthlyRecap/`:
- `IntroSequence.tsx` - Month/year title reveal
- `BookReveal.tsx` - Individual book animations
- `StatsReveal.tsx` - Monthly statistics
- `ComingSoonSequence.tsx` - Currently reading teaser
- `OutroSequence.tsx` - Branding/closing

Customize styling in `src/lib/theme.ts` and animations in `src/lib/animations.ts`.
