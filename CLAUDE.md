# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Cawpile is a book reading tracker with a custom CAWPILE rating system, built with Next.js 15, React 19, TypeScript, TailwindCSS 4, Prisma ORM, and NextAuth v5. It features multi-provider book search, reading progress tracking, admin tools, and analytics charts.

## Common Commands

### Development
- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production (runs `prisma generate` automatically)
- `npm run start` - Start production server
- `npm run lint` - Run ESLint for code quality checks

### Database
- `npx prisma migrate dev` - Create and apply migrations in development
- `npx prisma migrate deploy` - Apply migrations in production
- `npx prisma db push` - Push schema changes without migrations (dev only)
- `npx prisma studio` - Open Prisma Studio for database GUI

### Admin
- `npm run make-admin` - Create admin user (custom script)

### Testing
- `npm run test` - Run all Jest tests
- `npm run test -- path/to/test` - Run specific test file
- `npm run test -- --watch` - Run tests in watch mode

Tests are located in `__tests__/` directory with the following structure:
- `__tests__/components/` - React component tests (PublicReviewDisplay, SharePageLayout, etc.)
- `__tests__/lib/` - Utility function tests (sanitize, image generation)
- `__tests__/api/` - API route tests

Testing stack: Jest + React Testing Library + @testing-library/jest-dom

## Architecture

### Tech Stack
- **Frontend**: Next.js 15 (App Router), React 19, TypeScript, TailwindCSS 4
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL (Neon serverless), Prisma v6.15
- **Authentication**: NextAuth v5 with Google OAuth and Prisma Adapter
- **Charts**: Recharts v3.2
- **UI**: Headless UI, Heroicons

### Key Patterns
1. **Server-Side Rendering**: Heavy use of Server Components for initial data fetching
2. **API-Driven**: RESTful API routes handle all data mutations
3. **Multi-Provider Search**: Orchestrator pattern with parallel provider execution
4. **Admin Audit Trail**: All admin actions logged with before/after values
5. **Progressive Enhancement**: Features work with auth, graceful degradation

## Database Schema

### Core Models

**User** (NextAuth + app preferences)
- Sessions, Accounts (OAuth)
- UserBooks (reading library)
- BookClubs, Readathons (autocomplete history)
- AdminAuditLogs (admin actions)
- `dashboardLayout` (GRID | TABLE preference)

**Book** (title + authors, deduplicated across editions)
- Editions[] (different formats/ISBNs of same book)

**Edition** (ISBN-specific metadata)
- GoogleBook (enriched metadata from Google Books API)
- UserBooks[] (users tracking this edition)

**UserBook** (user's reading record)
- Status: WANT_TO_READ, READING, COMPLETED, DNF
- Tracking: startDate, endDate, pageCount, currentPage
- Format: PHYSICAL, EBOOK, AUDIOBOOK, GRAPHIC_NOVEL
- Acquisition method, book clubs, readathons
- CawpileRating (7-facet custom rating)
- ReadingSessions[] (page-by-page progress)

**CawpileRating** (7 customizable facets)
- Fiction: Characters, Atmosphere, Writing, Plot, Intrigue, Logic, Enjoyment
- Non-Fiction: Credibility, Authenticity, Writing, Personal Impact, Intrigue, Logic, Enjoyment
- Auto-computed average, stars, grade

### Unique Constraints
- `Book`: Unique on `(title, authors)` pair
- `Edition`: Unique ISBNs and Google Books ID
- `UserBook`: Unique on `(userId, editionId)` - prevents duplicate library entries

### Connection
- PostgreSQL with Neon serverless support
- Connection pooling via `@neondatabase/serverless`
- Singleton Prisma client pattern (`src/lib/prisma.ts`) prevents connection pool exhaustion

## Authentication

### Strategy
NextAuth v5 with JWT sessions + Prisma Adapter for Google OAuth 2.0

### Key Files
- `src/lib/auth.ts` - NextAuth configuration and handlers
- `src/lib/auth-helpers.ts` - Server-side user fetching (`getCurrentUser()`)
- `src/lib/auth-client.tsx` - Client-side session provider
- `src/lib/auth/admin.ts` - Admin checks (`requireAdmin()`, `requireSuperAdmin()`)
- `src/middleware.ts` - Route protection (redirects unauthenticated to `/auth/signin`)

### Admin Roles
- `isAdmin` - Access to admin panel
- `isSuperAdmin` - Super admin privileges
- Must be set manually in database or via `ADMIN_EMAILS` env var

### Session Data
```typescript
session.user = {
  id: string
  email: string
  name?: string
  image?: string
  isAdmin: boolean
  isSuperAdmin: boolean
}
```

## API Routes

### Book Operations
- `POST /api/user/books` - Add book to library
- `GET /api/user/books` - Get user's books (with status filter)
- `PATCH /api/user/books/[id]` - Update book (progress, dates, status)
- `DELETE /api/user/books/[id]` - Remove from library
- `GET /api/books/search` - Multi-provider search

### Chart Data
- `GET /api/charts/books-per-month` - Monthly reading volume (stacked: completed + DNF)
- `GET /api/charts/pages-per-month` - Pages read per month (excludes audiobooks)
- `GET /api/charts/dnf-per-month` - DNF books per month
- `GET /api/charts/book-format` - Format distribution
- `GET /api/charts/main-genres` - Genre distribution (fiction vs non-fiction)
- `GET /api/charts/acquisition-method` - How books were acquired
- `GET /api/charts/lgbtq-representation` - LGBTQ+ representation stats
- `GET /api/charts/disability-representation` - Disability representation stats
- `GET /api/charts/poc-authors` - POC author stats
- `GET /api/charts/new-authors` - New-to-user author stats
- `GET /api/charts/available-years` - Years with data

### User Preferences
- `PATCH /api/user/preferences` - Update dashboard layout
- `GET /api/user/book-clubs` - Autocomplete list
- `GET /api/user/readathons` - Autocomplete list

### Admin Operations
- `GET /api/admin/books` - Paginated book list (filtered, sorted)
- `POST /api/admin/books` - Create book
- `PATCH /api/admin/books/[id]` - Update book metadata
- `DELETE /api/admin/books/[id]` - Delete book
- `POST /api/admin/books/bulk` - Bulk operations
- `GET /api/admin/users` - User management
- `PATCH /api/admin/users/[id]` - Update user role
- `GET /api/admin/audit-log` - Admin action audit trail
- `GET /api/admin/stats` - System statistics

## Search System Architecture

### Pattern: Orchestrator + Strategy

**SearchOrchestrator** (`src/lib/search/SearchOrchestrator.ts`)
- Registers multiple providers with weights
- Executes searches in parallel with `Promise.allSettled`
- Merges results via `resultMerger.ts`
- Returns deduplicated, ranked results

**Providers** (implement `BaseSearchProvider`):
1. **LocalDatabaseProvider** (weight: 10) - Searches Book/Edition tables
2. **HardcoverProvider** (weight: 6) - External book metadata API
3. **GoogleBooksProvider** (weight: 5) - Google Books API
4. **IbdbProvider** (weight: 4) - Internet Book Database

**Result Merging** (`src/lib/search/utils/resultMerger.ts`):
1. Flatten all provider results
2. Group duplicates by ISBN or fuzzy title/author matching
3. Augment primary result with missing data from duplicates
4. Sort by provider weight (local highest)
5. Return limited, deduplicated results

**Fuzzy Matching** (`src/lib/search/utils/fuzzyMatch.ts`):
- Levenshtein distance for title similarity
- Author array matching with tolerance
- Handles "Last, First" vs "First Last" formats

## Component Patterns

### Server vs Client Components
- **Server** (default): `page.tsx`, `layout.tsx`, data-fetching components
- **Client** (`"use client"`): Modals, forms, interactive features, hooks

### Key Patterns

**1. Wizard Pattern** (`components/modals/AddBookWizard.tsx`)
- Multi-step form with progress indicator
- Conditional steps based on book status
- State management via `useState`

**2. Modal Pattern** (`components/modals/`)
- Headless UI Dialog component
- Escape key and backdrop click handling
- Transition animations

**3. Context Pattern** (`contexts/ChartDataContext.tsx`)
- Cache management (30-minute TTL)
- Session storage persistence
- Loading/error states per chart
- Custom `useChartData()` hook

**4. Layout Toggle** (`components/dashboard/LayoutToggle.tsx`)
- Optimistic UI updates
- Database persistence via `/api/user/preferences`

**5. Form Field Components** (`components/forms/`)
- Encapsulated field logic
- Reusable across modals
- Examples: `AcquisitionMethodField.tsx`, `BookClubField.tsx`

## Directory Structure

```
src/
├── app/
│   ├── api/                 # RESTful API endpoints
│   │   ├── auth/           # NextAuth configuration
│   │   ├── books/          # Public book operations
│   │   ├── user/           # User-scoped operations
│   │   ├── admin/          # Admin-only operations
│   │   └── charts/         # Chart data endpoints
│   ├── dashboard/          # Main user dashboard
│   ├── admin/              # Admin interface pages
│   ├── auth/               # Authentication pages
│   └── globals.css         # Global styles
│
├── components/
│   ├── dashboard/          # Dashboard-specific components
│   ├── modals/             # Modal dialogs
│   ├── forms/              # Reusable form fields
│   ├── charts/             # Chart components (Recharts)
│   ├── admin/              # Admin-specific UI
│   ├── rating/             # Cawpile rating system
│   ├── book/               # Book display components
│   └── layout/             # Global layout components
│
├── lib/
│   ├── search/             # Multi-provider search system
│   │   ├── providers/      # Search provider implementations
│   │   ├── utils/          # Fuzzy matching, merging, API clients
│   │   └── types.ts
│   ├── charts/             # Chart utilities and processors
│   ├── db/                 # Database utilities (findOrCreateBook, etc.)
│   ├── auth/               # Admin auth helpers
│   ├── audit/              # Admin action logging
│   ├── prisma.ts           # Prisma client singleton
│   ├── auth.ts             # NextAuth configuration
│   ├── auth-helpers.ts     # getCurrentUser()
│   └── googleBooks.ts      # Google Books API integration
│
├── types/
│   ├── book.ts             # Book, Edition, GoogleBook types
│   ├── cawpile.ts          # Rating system types
│   └── admin.ts            # Admin-specific types
│
├── hooks/
│   ├── useBookSearch.ts    # Search with debouncing
│   ├── useBookClubs.ts     # Autocomplete fetching
│   └── useDebounce.ts      # Generic debounce
│
├── contexts/
│   └── ChartDataContext.tsx # Chart data caching
│
├── middleware.ts           # Route protection
│
__tests__/                   # Jest test files
├── components/             # Component tests
├── lib/                    # Utility function tests
└── api/                    # API route tests
```

## Unique Features

### 1. Cawpile Rating System
- 7 customizable facets per book type
- Different facets for fiction vs non-fiction
- Auto-computed average, stars, grades
- Stored in `CawpileRating` table linked to `UserBook`

### 2. Reading Session Tracking
- Page-by-page progress logging via `ReadingSession` model
- Start page, end page, duration, session date
- Enables detailed reading analytics

### 3. Book Type Auto-Detection
- `detectBookType()` in `src/lib/bookTypeDetection.ts`
- Analyzes Google Books categories
- Maps 50+ non-fiction categories
- Fallback to FICTION for unknown

### 4. Dual-Level Book Storage
- `Book` model: Title + authors (deduplicated)
- `Edition` model: ISBN-specific metadata
- Allows tracking multiple editions
- `GoogleBook` enrichment layer

### 5. User Autocomplete Tracking
- `UserBookClub` & `UserReadathon` tables
- Per-user previously used values
- Usage count and last used date
- Enables intelligent autocomplete

### 6. Admin Audit Logging
- `AdminAuditLog` captures every admin action
- Who, what, when, before/after values
- Full audit trail for compliance

### 7. Social Sharing & Public Profiles
- **SharedReview** model: Public share links for individual reviews
- Privacy controls: showDates, showBookClubs, showReadathons, showReview
- Shareable image generation via `ReviewImageTemplate` component
- Public profile pages with customizable visibility
- Components: `PublicReviewDisplay`, `SharePageLayout`, `ProfilePageClient`

## Data Flow Examples

### Adding a Book
1. User searches via `SearchModal` → `GET /api/books/search`
2. `SearchOrchestrator` runs all providers in parallel
3. Results merged, deduplicated, returned
4. User selects book → opens `AddBookWizard`
5. Multi-step form: status → format → tracking fields → dates
6. `POST /api/user/books`
7. Backend: `getBookById()` → `findOrCreateBook()` → `findOrCreateEdition()`
8. Create `UserBook` record with all fields
9. Store book clubs/readathons in autocomplete tables
10. Client refetches dashboard

### Chart Data Loading
1. User clicks Charts tab
2. `ChartDataContext` checks cache (30-min TTL)
3. If miss: `GET /api/charts/books-per-month?year=2024`
4. Store in memory + sessionStorage
5. Component renders with cached data
6. Refresh button calls `fetchChartData(force=true)`

## Environment Variables

### Required
```env
DATABASE_URL                 # PostgreSQL connection string
NEXTAUTH_URL                 # Public URL (e.g., https://myapp.com)
NEXTAUTH_SECRET              # Random 32-char secret (openssl rand -base64 32)
GOOGLE_CLIENT_ID             # OAuth 2.0 Client ID
GOOGLE_CLIENT_SECRET         # OAuth 2.0 Client Secret
GOOGLE_BOOKS_API_KEY         # Google Books API key
```

### Optional
```env
ADMIN_EMAILS                 # Comma-separated list to auto-promote users
DEBUG                        # Enable debug logging (default: false)
SESSION_MAX_AGE              # Session duration in seconds (default: 15552000 = 6 months)
```

## Important Notes

### TypeScript Imports
- Use `@/` prefix for `src/` directory
- Example: `import { getCurrentUser } from "@/lib/auth-helpers"`

### Styling
- TailwindCSS 4 with custom CSS properties
- Dark mode via `prefers-color-scheme`
- Custom variables in `globals.css`: `--background`, `--foreground`, `--font-geist-sans`, `--font-geist-mono`

### Image Optimization
- Next.js Image component configured for Google Books and Books API domains
- See `next.config.ts` for remote patterns

### Database Operations
- Always use utility functions: `findOrCreateBook()`, `findOrCreateEdition()`
- Located in `src/lib/db/`
- Handle deduplication and enrichment automatically

### Security
- Middleware redirects unauthenticated users to `/auth/signin`
- Admin routes verify `isAdmin` flag before operations
- All admin actions logged in `AdminAuditLog`
- Prisma prevents SQL injection via parameterized queries
