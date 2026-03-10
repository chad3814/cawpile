# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Cawpile is a book reading tracker with a custom CAWPILE rating system, built with Next.js 16, React 19, TypeScript, TailwindCSS 4, Prisma ORM, and NextAuth v5. It features multi-provider book search, reading progress tracking, admin tools, and analytics charts.

## Common Commands

### Development
- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production with Turbopack (runs `prisma generate` automatically)
- `npm run lint` - Run ESLint for code quality checks
- `npm run make-admin` - Promote a user to admin (runs `scripts/fix-admin-user.ts`)

### Database
- `npx prisma migrate dev` - Create and apply migrations in development
- `npx prisma db push` - Push schema changes without migrations (dev only)
- `npx prisma studio` - Open Prisma Studio for database GUI

### Testing
- `npm run test` - Run all Jest tests (root) and Vitest tests (video-gen)
- `npm run test -- path/to/test` - Run specific test file
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report

Tests are in `__tests__/` with subdirectories: `components/`, `lib/`, `api/`, `database/`, `integration/`, `hooks/`, `app/`

Jest uses `maxWorkers: 1` to prevent database connection contention. Tests ignore `/services/` directory. The `nanoid` module is mocked via `__mocks__/nanoid.ts`. Root `npm run test` and `npm run lint` cascade into `services/video-gen` via `--prefix`.

## Monorepo Structure

This repo contains two independently deployable services:

- **Root (Next.js app)** — Deployed to Vercel
- **services/video-gen** — Remotion + Express video render server, deployed to EC2 via Docker/GHCR/Watchtower

### Video Gen Service
- Has its own `package.json`, `node_modules`, and `CLAUDE.md`
- Uses React 18 (Remotion requirement) — NOT React 19
- `cd services/video-gen && npm install` to install its dependencies
- `npm run server` to start the Express server (port 3001)
- `npm run dev` to start Remotion Studio
- `npm run test` to run Vitest tests
- Dockerfile builds and deploys independently

## Architecture

### Tech Stack
- **Frontend**: Next.js 16 (App Router), React 19.1, TypeScript, TailwindCSS 4
- **Backend**: Next.js API Routes, Prisma v6.15
- **Database**: PostgreSQL (Neon serverless)
- **Authentication**: NextAuth v5 with Google OAuth and Prisma Adapter
- **Charts**: Recharts v3.2
- **UI**: Headless UI, Heroicons

### Additional Infrastructure
- **S3 Storage**: Avatar uploads (`cawpile-avatars` bucket) and cover image caching (`cawpile-downloads` bucket) via `@aws-sdk/client-s3`
- **Image Processing**: `sharp` for server-side image manipulation
- **Data Export**: CSV/ZIP export of user data (`src/lib/export/`, `src/app/api/user/export/`)

### Key Patterns
1. **Server Components**: Default for pages/layouts; `"use client"` for modals, forms, hooks
2. **Multi-Provider Search**: Orchestrator pattern with parallel `Promise.allSettled` execution
3. **Dual-Level Book Storage**: Book (title/authors) → Edition (ISBN) → Provider metadata (GoogleBook/HardcoverBook/IbdbBook)
4. **Admin Audit Trail**: All admin actions logged with before/after values in AdminAuditLog
5. **Search Result Signing**: HMAC-SHA256 signatures validate search results between search and book addition (`src/lib/search/utils/signResult.ts`)

## Database Schema

### Core Models

**User** (NextAuth + app preferences)
- OAuth via Account/Session models
- Profile settings: username, bio, readingGoal, profileEnabled, showCurrentlyReading, showTbr
- Dashboard settings: dashboardLayout (GRID|TABLE), librarySortBy, librarySortOrder
- Admin flags: isAdmin, isSuperAdmin
- Template selection: `selectedTemplateId` → VideoTemplate (onDelete: SetNull)

**Book → Edition → Provider Metadata** (three-level hierarchy)
- `Book`: title + authors, unique on `(title, authors)` pair, bookType (FICTION|NONFICTION)
- `Edition`: ISBN-specific (isbn10, isbn13, googleBooksId), links to Book
- `GoogleBook`, `HardcoverBook`, `IbdbBook`: Provider-specific metadata linked to Edition

**VideoTemplate** (video recap template config)
- Config: JSON blob storing full template configuration (colors, fonts, timing, layout per sequence)
- Creator: `userId` (nullable) → User relation; null means system template
- Publishing: `isPublished` (default false), `usageCount` (tracks selections)
- User selection: Users pick a template via `User.selectedTemplateId`
- Index on `(isPublished, createdAt)` for efficient browse queries

**UserBook** (user's reading record)
- Status: WANT_TO_READ, READING, COMPLETED, DNF
- Format: HARDCOVER, PAPERBACK, EBOOK, AUDIOBOOK (array field)
- Tracking: startDate, finishDate, progress, currentPage
- Diversity fields: lgbtqRepresentation, disabilityRepresentation, isNewAuthor, authorPoc
- CawpileRating (1:1), ReadingSessions[] (1:many), SharedReview (1:1)

**CawpileRating** (7 facets, 1-10 scale each, nullable for skipped)
- Fiction: Characters, Atmosphere, Writing, Plot, Intrigue, Logic, Enjoyment
- Non-Fiction: Credibility, Authenticity, Writing, Personal Impact, Intrigue, Logic, Enjoyment
- Auto-computed `average` field

### Key Constraints
- `Book`: Unique on `(title, authors)`
- `Edition`: Unique isbn10, isbn13, googleBooksId
- `UserBook`: Unique on `(userId, editionId)`

### Connection
- Singleton Prisma client pattern (`src/lib/prisma.ts`)
- Neon serverless connection pooling via `@neondatabase/serverless`

## Authentication

### Key Files
- `src/lib/auth.ts` - NextAuth v5 configuration (Google OAuth + Prisma Adapter)
- `src/lib/auth-helpers.ts` - `getCurrentUser()` for server-side user fetching
- `src/lib/auth/admin.ts` - `requireAdmin()`, `requireSuperAdmin()` guards

### Session Data
```typescript
session.user = { id, email, name?, image?, isAdmin, isSuperAdmin }
```

## API Routes

Routes follow RESTful patterns in `src/app/api/`:
- `/api/books/search` - Multi-provider search
- `/api/user/books` - CRUD for user's library (GET, POST, PATCH, DELETE)
- `/api/user/preferences`, `/api/user/book-clubs`, `/api/user/readathons`
- `/api/user/export` - CSV/ZIP data export
- `/api/reading-sessions` - Reading session CRUD
- `/api/charts/*` - Analytics data (11 chart types: books-per-month, pages-per-month, book-format, main-genres, acquisition-method, lgbtq/disability/poc/new-author representation, dnf-per-month, available-years)
- `/api/admin/*` - Admin operations (books, users, audit-log, stats, data-quality, editions/covers, bulk ops, resync) - require `isAdmin`
- `/api/share/*` - Public review sharing
- `/api/recap/monthly` - Monthly reading recap data for video generation
- `/api/templates/*` - Admin video template CRUD (GET, POST, PATCH, DELETE) - require `isAdmin`
- `/api/templates/[id]/background/*` - Template background image upload (presigned URL, sharp resize to 1080x1920, S3 delete)
- `/api/user/templates` - Browse published templates (paginated, sortable, searchable)
- `/api/user/templates/[id]` - Single template detail
- `/api/user/templates/[id]/select` - Select template for user's recap (atomic usageCount increment)
- `/api/user/templates/[id]/duplicate` - Fork template as personal unpublished copy
- `/api/user/templates/mine` - User's personal (duplicated) templates

## Search System Architecture

**SearchOrchestrator** (`src/lib/search/SearchOrchestrator.ts`)
- Executes all providers in parallel with `Promise.allSettled`
- Merges and deduplicates via `resultMerger.ts` (ISBN matching + fuzzy title/author)

**Providers** (`src/lib/search/providers/`):
1. **LocalDatabaseProvider** (weight: 10) - Searches existing Book/Edition tables
2. **HardcoverProvider** (weight: 6) - Hardcover.app GraphQL API
3. **GoogleBooksProvider** (weight: 5) - Google Books API
4. **IbdbProvider** (weight: 4) - IBDB.dev API

**Utilities** (`src/lib/search/utils/`):
- `resultMerger.ts` - Deduplication by ISBN or fuzzy matching
- `fuzzyMatch.ts` - Levenshtein distance for title/author similarity
- `hardcoverClient.ts`, `ibdbClient.ts` - API clients

## Component Patterns

**Wizard Pattern** (`components/modals/AddBookWizard.tsx`)
- Multi-step form with conditional steps based on book status

**Modal Pattern** (`components/modals/`)
- Headless UI Dialog with Transition animations

**Context Pattern** (`contexts/ChartDataContext.tsx`)
- Chart data caching with 30-minute TTL, sessionStorage persistence

**Form Field Components** (`components/forms/`)
- Reusable field components: `AcquisitionMethodField`, `BookClubField`, etc.

**Template Editor Pattern** (`components/templates/TemplateEditorClient.tsx`)
- `useReducer` for nested config state management with per-section actions
- 8-tab single-page editor (Colors, Fonts, Timing, Intro, Book Reveal, Stats Reveal, Coming Soon, Outro)
- `TemplatePreviewPanel` for reactive static preview (color swatches, font samples, layout badges, timing bar, background thumbnails)
- Timing auto-calculation: admins set sequence totals, sub-timings derived proportionally (`src/lib/video/timingCalculation.ts`)
- Background image upload: 3-step flow (presigned URL → S3 PUT → server-side resize), per-sequence with global fallback and overlay opacity slider

## Key Directories

```
src/
├── app/api/          # RESTful endpoints (auth/, books/, user/, admin/, charts/, share/, templates/)
├── app/dashboard/    # Dashboard pages (templates/ for browse, create, edit, detail)
├── components/       # React components by domain (dashboard/, modals/, forms/, charts/, admin/, rating/, templates/)
├── lib/
│   ├── search/       # Multi-provider search (providers/, utils/, types.ts)
│   ├── db/           # Database utilities (findOrCreateBook, findOrCreateEdition)
│   ├── auth/         # Admin auth helpers
│   ├── video/        # Video template utilities (validateTemplateConfig, timingCalculation)
│   └── charts/       # Chart data processors
├── hooks/            # Custom hooks (useBookSearch, useDebounce, useBookClubs, useReadathons, useUsernameCheck)
├── contexts/         # React contexts (ChartDataContext)
└── types/            # TypeScript types (book.ts, cawpile.ts, video-template.ts)

__tests__/            # Jest tests mirroring src/ structure
```

## Key Features

**Cawpile Rating**: 7 facets (1-10 scale), auto-computed average, stored in `CawpileRating` table

**Book Type Detection**: `src/lib/bookTypeDetection.ts` - analyzes categories to determine FICTION/NONFICTION

**Autocomplete Tracking**: `UserBookClub` & `UserReadathon` tables store per-user history with usage counts

**Social Sharing**: `SharedReview` model with privacy controls, `ReviewImageTemplate` for shareable images

**Public Profiles**: User profiles at `/u/[username]` with privacy controls (profileEnabled, showCurrentlyReading, showTbr)

**Monthly Recap**: Video recap generation via integration with video-gen service (`/api/recap/monthly`)

**Template System**: Admin-created video templates with user browsing and selection
- Browse: `/dashboard/templates` — card grid with search, sort (newest/name/popular), pagination
- Detail: `/dashboard/templates/[id]` — full config display with select and duplicate actions
- Create/Edit: `/dashboard/templates/create` and `/dashboard/templates/[id]/edit` — admin-only tabbed editor
- Background images: global + per-sequence overrides with configurable overlay opacity, S3 upload via presigned URLs, resized to 1080x1920 with sharp
- Types shared between main app (`src/types/video-template.ts`) and video-gen service (`services/video-gen/src/lib/template-types.ts`) — keep in sync manually
- `getEffectiveTemplate()` resolves defaults, merges partials, and applies global-to-sequence fallback for background images

## Data Flow: Adding a Book

1. Search via `SearchModal` → `GET /api/books/search` → `SearchOrchestrator` runs providers in parallel
2. User selects book → `AddBookWizard` (multi-step form)
3. `POST /api/user/books` → `findOrCreateBook()` → `findOrCreateEdition()` → create `UserBook`
4. Autocomplete entries saved to `UserBookClub`/`UserReadathon` tables

## Environment Variables

See `.env.example` for full list with descriptions.

**Required:**
- `DATABASE_URL` - PostgreSQL connection string (Neon)
- `NEXTAUTH_URL`, `NEXTAUTH_SECRET` - NextAuth configuration
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` - OAuth credentials
- `GOOGLE_BOOKS_API_KEY` - Google Books API

**S3 (for avatars/covers):**
- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `AWS_S3_BUCKET`

**Optional:**
- `ADMIN_EMAILS` - Comma-separated list to auto-promote to admin
- `NEXT_PUBLIC_RENDER_SERVER_URL` - Video render server URL (defaults to `http://localhost:3001`)
- `SEARCH_SIGNING_SECRET` - HMAC key for search result signing (min 32 chars)
- `DEBUG` - Enable debug logging
- `SESSION_MAX_AGE` - Session duration in seconds (default: 6 months)

## Important Notes

**Imports**: Use `@/` prefix for `src/` directory (e.g., `import { getCurrentUser } from "@/lib/auth-helpers"`)

**Database Operations**: Always use `findOrCreateBook()` and `findOrCreateEdition()` from `src/lib/db/` - they handle deduplication automatically

**Styling**: TailwindCSS 4 with dark mode via `prefers-color-scheme`

**Image Domains**: Configured in `next.config.ts` for Google Books (`books.google.com`), Google user content (`*.googleusercontent.com`), and S3 (`*.amazonaws.com`). Images are unoptimized.
