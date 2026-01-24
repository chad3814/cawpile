# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Cawpile is a book reading tracker with a custom CAWPILE rating system, built with Next.js 16, React 19, TypeScript, TailwindCSS 4, Prisma ORM, and NextAuth v5. It features multi-provider book search, reading progress tracking, admin tools, and analytics charts.

## Common Commands

### Development
- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production (runs `prisma generate` automatically)
- `npm run lint` - Run ESLint for code quality checks

### Database
- `npx prisma migrate dev` - Create and apply migrations in development
- `npx prisma db push` - Push schema changes without migrations (dev only)
- `npx prisma studio` - Open Prisma Studio for database GUI

### Testing
- `npm run test` - Run all Jest tests
- `npm run test -- path/to/test` - Run specific test file
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report

Tests are in `__tests__/` with subdirectories: `components/`, `lib/`, `api/`, `database/`, `integration/`, `hooks/`, `app/`

## Architecture

### Tech Stack
- **Frontend**: Next.js 16 (App Router), React 19.1, TypeScript, TailwindCSS 4
- **Backend**: Next.js API Routes, Prisma v6.15
- **Database**: PostgreSQL (Neon serverless)
- **Authentication**: NextAuth v5 with Google OAuth and Prisma Adapter
- **Charts**: Recharts v3.2
- **UI**: Headless UI, Heroicons

### Key Patterns
1. **Server Components**: Default for pages/layouts; `"use client"` for modals, forms, hooks
2. **Multi-Provider Search**: Orchestrator pattern with parallel `Promise.allSettled` execution
3. **Dual-Level Book Storage**: Book (title/authors) → Edition (ISBN) → Provider metadata (GoogleBook/HardcoverBook/IbdbBook)
4. **Admin Audit Trail**: All admin actions logged with before/after values in AdminAuditLog

## Database Schema

### Core Models

**User** (NextAuth + app preferences)
- OAuth via Account/Session models
- Profile settings: username, bio, readingGoal, profileEnabled, showCurrentlyReading, showTbr
- Dashboard settings: dashboardLayout (GRID|TABLE), librarySortBy, librarySortOrder
- Admin flags: isAdmin, isSuperAdmin

**Book → Edition → Provider Metadata** (three-level hierarchy)
- `Book`: title + authors, unique on `(title, authors)` pair, bookType (FICTION|NONFICTION)
- `Edition`: ISBN-specific (isbn10, isbn13, googleBooksId), links to Book
- `GoogleBook`, `HardcoverBook`, `IbdbBook`: Provider-specific metadata linked to Edition

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
- Singleton Prisma client pattern (`src/lib/prisma.ts`)
- Neon serverless connection pooling via `@neondatabase/serverless`

## Authentication

### Key Files
- `src/lib/auth.ts` - NextAuth v5 configuration (Google OAuth + Prisma Adapter)
- `src/lib/auth-helpers.ts` - `getCurrentUser()` for server-side user fetching
- `src/lib/auth/admin.ts` - `requireAdmin()`, `requireSuperAdmin()` guards
- `src/middleware.ts` - Route protection (redirects unauthenticated to `/auth/signin`)

### Session Data
```typescript
session.user = { id, email, name?, image?, isAdmin, isSuperAdmin }
```

## API Routes

Routes follow RESTful patterns in `src/app/api/`:
- `/api/books/search` - Multi-provider search
- `/api/user/books` - CRUD for user's library (GET, POST, PATCH, DELETE)
- `/api/user/preferences`, `/api/user/book-clubs`, `/api/user/readathons`
- `/api/charts/*` - Analytics data (books-per-month, pages-per-month, book-format, etc.)
- `/api/admin/*` - Admin operations (books, users, audit-log, stats) - require `isAdmin`
- `/api/share/*` - Public review sharing

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

## Key Directories

```
src/
├── app/api/          # RESTful endpoints (auth/, books/, user/, admin/, charts/, share/)
├── components/       # React components by domain (dashboard/, modals/, forms/, charts/, admin/, rating/)
├── lib/
│   ├── search/       # Multi-provider search (providers/, utils/, types.ts)
│   ├── db/           # Database utilities (findOrCreateBook, findOrCreateEdition)
│   ├── auth/         # Admin auth helpers
│   └── charts/       # Chart data processors
├── hooks/            # Custom hooks (useBookSearch, useDebounce)
├── contexts/         # React contexts (ChartDataContext)
└── types/            # TypeScript types (book.ts, cawpile.ts)

__tests__/            # Jest tests mirroring src/ structure
```

## Key Features

**Cawpile Rating**: 7 facets (1-10 scale), auto-computed average, stored in `CawpileRating` table

**Book Type Detection**: `src/lib/bookTypeDetection.ts` - analyzes categories to determine FICTION/NONFICTION

**Autocomplete Tracking**: `UserBookClub` & `UserReadathon` tables store per-user history with usage counts

**Social Sharing**: `SharedReview` model with privacy controls, `ReviewImageTemplate` for shareable images

## Data Flow: Adding a Book

1. Search via `SearchModal` → `GET /api/books/search` → `SearchOrchestrator` runs providers in parallel
2. User selects book → `AddBookWizard` (multi-step form)
3. `POST /api/user/books` → `findOrCreateBook()` → `findOrCreateEdition()` → create `UserBook`
4. Autocomplete entries saved to `UserBookClub`/`UserReadathon` tables

## Environment Variables

**Required:**
- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_URL`, `NEXTAUTH_SECRET` - NextAuth configuration
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` - OAuth credentials
- `GOOGLE_BOOKS_API_KEY` - Google Books API

**Optional:**
- `ADMIN_EMAILS` - Comma-separated list to auto-promote to admin

## Important Notes

**Imports**: Use `@/` prefix for `src/` directory (e.g., `import { getCurrentUser } from "@/lib/auth-helpers"`)

**Database Operations**: Always use `findOrCreateBook()` and `findOrCreateEdition()` from `src/lib/db/` - they handle deduplication automatically

**Styling**: TailwindCSS 4 with dark mode via `prefers-color-scheme`

**Image Domains**: Configured in `next.config.ts` for Google Books, Hardcover, and IBDB
