# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Remotion-based video generator for TikTok-style (9:16) monthly reading recap videos from Cawpile book data. Renders animated videos with book covers, ratings, and statistics.

**Stack**: TypeScript 5.6, Remotion 4.0, React 18.3, Express 4.21, Vitest
**Video Output**: 1080x1920 @ 30fps H.264

## Commands

```bash
npm run dev          # Remotion Studio preview
npm run server       # Express server on port 3001
npm run build        # Bundle Remotion project
npm run render       # Render MonthlyRecap to out/video.mp4
npm run lint         # ESLint on src/
npm run test         # Vitest watch mode
npm run test:run     # Vitest single run
```

Run a single test file:
```bash
npx vitest run server/__tests__/api.test.ts
```

## Architecture

### Remotion Composition Flow

`src/compositions/MonthlyRecap/index.tsx` orchestrates video sequences:
1. **IntroSequence** (75 frames) - Month/year title
2. **BookReveal** (150 frames each) - Cover + ratings per book
3. **StatsReveal** (120 frames) - Monthly statistics
4. **ComingSoonSequence** (90 frames) - Currently reading preview
5. **OutroSequence** (90 frames) - Branding

Duration is dynamic via `calculateDuration()` which sums frames with transition overlaps.

### Server Endpoints

- `POST /render` - Synchronous render, returns S3 URL
- `GET /render-stream` - SSE streaming progress (bundling 0-50%, rendering 50-100%)
- `GET /download/:filename` - Download video
- `GET /videos` - List rendered videos
- `GET /health` - Health check

### Key Files

- `src/lib/types.ts` - Core interfaces: `MonthlyRecapExport`, `RenderRequest`, `RecapBook`
- `src/lib/theme.ts` - Colors, fonts, timing, `VIDEO_CONFIG` (1080x1920, 30fps)
- `src/lib/animations.ts` - Easing functions, fade/slide/scale utilities
- `src/components/KineticText.tsx` - Text animations (slam, typewriter, fadeUp, scaleIn)
- `server/index.ts` - Express server with Remotion bundling/rendering

### Path Alias

`@/*` maps to `src/*` (configured in tsconfig.json)

## Animation System

All timing is frame-based (30fps). Use frame numbers, not milliseconds.

Key animation utilities in `src/lib/animations.ts`:
- `fadeIn/fadeOut` - opacity transitions
- `slideInFromLeft/Right/Bottom` - directional slides
- `scaleIn`, `popIn` - scaling with spring physics
- `countUp` - animated number counters
- `staggerDelay` - list item offsets

## Docker Deployment

Container uses Noto Color Emoji font for star ratings. AWS credentials via Docker secrets at `/run/secrets/`. Required env vars: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `S3_BUCKET_NAME`.

## Testing Notes

Server tests in `server/__tests__/`, component tests in `src/compositions/MonthlyRecap/__tests__/`.

Tests mock Remotion bundler/renderer and AWS S3 client. Integration tests verify full render workflow.
