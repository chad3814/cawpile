# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Cawpile is a book reading tracker with a custom CAWPILE rating system. The repository is structured as an npm workspaces monorepo containing:

- **`apps/web/`** -- Next.js 16, React 19, TypeScript, TailwindCSS 4, Prisma ORM, NextAuth v5 web application. Deployed to Vercel.
- **`packages/shared/`** -- Shared TypeScript types and pure utility functions consumed by both web and mobile apps. No React or Prisma dependencies.
- **`services/video-gen/`** -- Remotion + Express video render server, deployed to EC2 via Docker/GHCR/Watchtower. Uses React 18 (Remotion requirement).

## Common Commands

All commands run from the **monorepo root**.

### Development
- `npm run dev` - Start web development server with Turbopack
- `npm run dev:web` - Same as above (explicit)
- `npm run build` - Build web app for production (runs `prisma generate` automatically)
- `npm run build:shared` - Build the shared package
- `npm run lint` - Run ESLint on the web app

### Database
- `npm run -w apps/web -- npx prisma migrate dev` - Create and apply migrations
- `npm run -w apps/web -- npx prisma db push` - Push schema changes without migrations (dev only)
- `npm run -w apps/web -- npx prisma studio` - Open Prisma Studio for database GUI

### Testing
- `npm run test` - Run all Jest tests for the web app
- `npm run test:web` - Same as above (explicit)
- `npm run test:shared` - Run shared package tests
- `npm run test:video-gen` - Run Vitest tests for video-gen service
- `npm run test -w apps/web -- --testPathPatterns="path/to/test"` - Run specific test file

Tests in `apps/web/__tests__/` with subdirectories: `components/`, `lib/`, `api/`, `database/`, `integration/`, `hooks/`, `app/`, `monorepo/`

Jest uses `maxWorkers: 1` to prevent database connection contention. The `nanoid` module is mocked via `apps/web/__mocks__/nanoid.ts`.

### Workspace Commands
- `npm install` - Installs all workspace dependencies from root
- `npm run build -w packages/shared` - Build a specific workspace
- `npm run test -w apps/web` - Test a specific workspace
- `npm run test:run -w services/video-gen` - Run video-gen tests

## Monorepo Structure

```
cawpile/
├── apps/
│   └── web/                 # Next.js web application (deployed to Vercel)
│       ├── src/             # Application source code
│       ├── prisma/          # Database schema and migrations
│       ├── public/          # Static assets
│       ├── __tests__/       # Jest tests
│       ├── __mocks__/       # Test mocks
│       ├── scripts/         # Utility scripts
│       ├── package.json     # Web app dependencies
│       ├── tsconfig.json    # TypeScript config (paths: @/* -> ./src/*)
│       ├── jest.config.ts   # Jest configuration
│       └── ...config files
├── packages/
│   └── shared/              # Shared TypeScript types and utilities
│       ├── src/             # Source (types/, utils/, index.ts)
│       ├── dist/            # Compiled output (ESM + .d.ts)
│       ├── package.json     # @cawpile/shared
│       └── tsconfig.json
├── services/
│   └── video-gen/           # Remotion video render server (deployed to EC2)
│       ├── src/             # Remotion compositions and components
│       ├── server/          # Express API server
│       ├── package.json     # Independent dependencies (React 18)
│       └── Dockerfile
├── package.json             # Root workspace config
├── vercel.json              # Vercel deployment config (points to apps/web)
├── .github/                 # CI workflows
├── CLAUDE.md                # This file
├── docs/                    # Documentation
├── claudedocs/              # Claude-specific docs
└── spekka/                  # Spec management
```

### Shared Package (`@cawpile/shared`)
- Package name: `@cawpile/shared`, referenced as `"@cawpile/shared": "*"` in web's dependencies
- Contains: shared TypeScript types (book, cawpile, dashboard, profile) and pure utility functions
- No React dependency -- pure TypeScript, consumable by both web (React 19) and mobile (React 18)
- Build output: ESM with TypeScript declarations in `dist/`
- Import in web app: `import { calculateCawpileAverage } from '@cawpile/shared'`

### Video Gen Service
- Has its own `package.json`, `node_modules`, and `CLAUDE.md`
- Uses React 18 (Remotion requirement) -- NOT React 19
- Included in npm workspaces; a `postinstall` script handles React version isolation for tests
- `npm run test:run -w services/video-gen` to run Vitest tests
- Dockerfile builds and deploys independently

## Architecture

### Tech Stack
- **Frontend**: Next.js 16 (App Router), React 19.1, TypeScript, TailwindCSS 4
- **Backend**: Next.js API Routes, Prisma v6.15
- **Database**: PostgreSQL (Neon serverless)
- **Authentication**: NextAuth v5 with Google OAuth and Prisma Adapter; JWT-based mobile auth
- **Charts**: Recharts v3.2
- **UI**: Headless UI, Heroicons

### Additional Infrastructure
- **S3 Storage**: Avatar uploads (`cawpile-avatars` bucket) and cover image caching (`cawpile-downloads` bucket) via `@aws-sdk/client-s3`
- **Image Processing**: `sharp` for server-side image manipulation
- **Data Export**: CSV/ZIP export of user data (`apps/web/src/lib/export/`, `apps/web/src/app/api/user/export/`)

### Key Patterns
1. **Server Components**: Default for pages/layouts; `"use client"` for modals, forms, hooks
2. **Multi-Provider Search**: Orchestrator pattern with parallel `Promise.allSettled` execution
3. **Dual-Level Book Storage**: Book (title/authors) -> Edition (ISBN) -> Provider metadata (GoogleBook/HardcoverBook/IbdbBook)
4. **Admin Audit Trail**: All admin actions logged with before/after values in AdminAuditLog
5. **Search Result Signing**: HMAC-SHA256 signatures validate search results between search and book addition (`apps/web/src/lib/search/utils/signResult.ts`)

## Database Schema

### Core Models

**User** (NextAuth + app preferences)
- OAuth via Account/Session models
- Profile settings: username, bio, readingGoal, profileEnabled, showCurrentlyReading, showTbr
- Dashboard settings: dashboardLayout (GRID|TABLE), librarySortBy, librarySortOrder
- Admin flags: isAdmin, isSuperAdmin
- Template selection: `selectedTemplateId` -> VideoTemplate (onDelete: SetNull)

**Book -> Edition -> Provider Metadata** (three-level hierarchy)
- `Book`: title + authors, unique on `(title, authors)` pair, bookType (FICTION|NONFICTION)
- `Edition`: ISBN-specific (isbn10, isbn13, googleBooksId), links to Book
- `GoogleBook`, `HardcoverBook`, `IbdbBook`: Provider-specific metadata linked to Edition

**VideoTemplate** (video recap template config)
- Config: JSON blob storing full template configuration (colors, fonts, timing, layout per sequence)
- Creator: `userId` (nullable) -> User relation; null means system template
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
- Auto-computed `average` field

### Key Constraints
- `Book`: Unique on `(title, authors)`
- `Edition`: Unique isbn10, isbn13, googleBooksId
- `UserBook`: Unique on `(userId, editionId)`

### Connection
- Singleton Prisma client pattern (`apps/web/src/lib/prisma.ts`)
- Neon serverless connection pooling via `@neondatabase/serverless`

## Authentication

### Key Files
- `apps/web/src/lib/auth.ts` - NextAuth v5 configuration (Google OAuth + Prisma Adapter)
- `apps/web/src/lib/auth-helpers.ts` - `getCurrentUser()` for server-side user fetching (supports both cookie and Bearer JWT auth)
- `apps/web/src/lib/auth/admin.ts` - `requireAdmin()`, `requireSuperAdmin()` guards
- `apps/web/src/lib/auth/mobile-jwt.ts` - JWT generation and verification for mobile auth
- `apps/web/src/lib/auth/mobile-auth.ts` - Mobile auth middleware helper

### Session Data
```typescript
session.user = { id, email, name?, image?, isAdmin, isSuperAdmin }
```

### Mobile Authentication
- `POST /api/auth/mobile` accepts a Google ID token and returns a signed JWT
- Mobile clients send JWT as `Bearer` token in `Authorization` header
- `getCurrentUser()` checks for Bearer token as fallback when no NextAuth session exists

## API Routes

Routes follow RESTful patterns in `apps/web/src/app/api/`:
- `/api/auth/mobile` - Mobile token exchange (POST with Google ID token, returns JWT)
- `/api/books/search` - Multi-provider search
- `/api/user/books` - CRUD for user's library (GET, POST, PATCH, DELETE)
- `/api/user/preferences`, `/api/user/book-clubs`, `/api/user/readathons`
- `/api/user/export` - CSV/ZIP data export
- `/api/reading-sessions` - Reading session CRUD
- `/api/charts/*` - Analytics data (11 chart types)
- `/api/admin/*` - Admin operations - require `isAdmin`
- `/api/share/*` - Public review sharing
- `/api/recap/monthly` - Monthly reading recap data for video generation
- `/api/templates/*` - Admin video template CRUD - require `isAdmin`
- `/api/user/templates` - Browse published templates (paginated, sortable, searchable)

## Search System Architecture

**SearchOrchestrator** (`apps/web/src/lib/search/SearchOrchestrator.ts`)
- Executes all providers in parallel with `Promise.allSettled`
- Merges and deduplicates via `resultMerger.ts` (ISBN matching + fuzzy title/author)

**Providers** (`apps/web/src/lib/search/providers/`):
1. **LocalDatabaseProvider** (weight: 10) - Searches existing Book/Edition tables
2. **HardcoverProvider** (weight: 6) - Hardcover.app GraphQL API
3. **GoogleBooksProvider** (weight: 5) - Google Books API
4. **IbdbProvider** (weight: 4) - IBDB.dev API

## Component Patterns

**Wizard Pattern** (`apps/web/src/components/modals/AddBookWizard.tsx`)
- Multi-step form with conditional steps based on book status

**Modal Pattern** (`apps/web/src/components/modals/`)
- Headless UI Dialog with Transition animations

**Context Pattern** (`apps/web/src/contexts/ChartDataContext.tsx`)
- Chart data caching with 30-minute TTL, sessionStorage persistence

**Form Field Components** (`apps/web/src/components/forms/`)
- Reusable field components: `AcquisitionMethodField`, `BookClubField`, etc.

**Template Editor Pattern** (`apps/web/src/components/templates/TemplateEditorClient.tsx`)
- `useReducer` for nested config state management with per-section actions
- 8-tab single-page editor (Colors, Fonts, Timing, Intro, Book Reveal, Stats Reveal, Coming Soon, Outro)

## Key Directories

```
apps/web/
├── src/
│   ├── app/api/          # RESTful endpoints (auth/, books/, user/, admin/, charts/, share/, templates/)
│   ├── app/dashboard/    # Dashboard pages (templates/ for browse, create, edit, detail)
│   ├── components/       # React components by domain (dashboard/, modals/, forms/, charts/, admin/, rating/, templates/)
│   ├── lib/
│   │   ├── search/       # Multi-provider search (providers/, utils/, types.ts)
│   │   ├── db/           # Database utilities (findOrCreateBook, findOrCreateEdition)
│   │   ├── auth/         # Admin auth helpers, mobile JWT auth
│   │   ├── video/        # Video template utilities (validateTemplateConfig, timingCalculation)
│   │   └── charts/       # Chart data processors
│   ├── hooks/            # Custom hooks (useBookSearch, useDebounce, useBookClubs, useReadathons, useUsernameCheck)
│   ├── contexts/         # React contexts (ChartDataContext)
│   └── types/            # TypeScript types (book.ts, cawpile.ts, video-template.ts)
├── __tests__/            # Jest tests mirroring src/ structure
└── prisma/               # Database schema and migrations

packages/shared/
├── src/
│   ├── types/            # Shared type definitions (book.ts, cawpile.ts, dashboard.ts, profile.ts)
│   ├── utils/            # Pure utility functions (cawpile.ts, bookType.ts)
│   └── index.ts          # Barrel exports
└── dist/                 # Compiled ESM output
```

## Data Flow: Adding a Book

1. Search via `SearchModal` -> `GET /api/books/search` -> `SearchOrchestrator` runs providers in parallel
2. User selects book -> `AddBookWizard` (multi-step form)
3. `POST /api/user/books` -> `findOrCreateBook()` -> `findOrCreateEdition()` -> create `UserBook`
4. Autocomplete entries saved to `UserBookClub`/`UserReadathon` tables

## Environment Variables

See `apps/web/.env.example` for full list with descriptions.

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

**Imports**: In `apps/web/`, use `@/` prefix for `src/` directory (e.g., `import { getCurrentUser } from "@/lib/auth-helpers"`). Use `@cawpile/shared` for shared types and utilities.

**Database Operations**: Always use `findOrCreateBook()` and `findOrCreateEdition()` from `apps/web/src/lib/db/` - they handle deduplication automatically

**Styling**: TailwindCSS 4 with dark mode via `prefers-color-scheme`

**Image Domains**: Configured in `apps/web/next.config.ts` for Google Books (`books.google.com`), Google user content (`*.googleusercontent.com`), and S3 (`*.amazonaws.com`). Images are unoptimized.
