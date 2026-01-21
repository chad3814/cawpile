# Task Breakdown: Missing Covers Bug Fix

## Overview
Total Tasks: 6 Task Groups with 30+ sub-tasks

This fix ensures book covers displayed in search results appear consistently in the user's library by implementing multi-provider fallback logic and fixing data retrieval gaps.

## Task List

### Foundation Layer

#### Task Group 1: Type Definitions and Utility Function ✅
**Dependencies:** None

- [x] 1.0 Complete type and utility foundation
  - [x] 1.2 Extend DashboardBookData type in `src/types/dashboard.ts`
    - Add `hardcoverBook: { imageUrl: string | null } | null` to edition type
    - Add `ibdbBook: { imageUrl: string | null } | null` to edition type
    - Preserve existing `googleBook` structure
  - [x] 1.3 Create getCoverImageUrl() utility function
    - Create file at `src/lib/utils/getCoverImageUrl.ts`
    - Accept edition object with all three provider relations
    - Implement fallback order: Hardcover > Google > IBDB
    - Return first non-null imageUrl or undefined if none
    - Reference existing pattern in `getEnrichedBookData()` at `src/lib/db/books.ts` lines 416-421

**Acceptance Criteria:**
- DashboardBookData type includes hardcoverBook and ibdbBook relations ✅
- getCoverImageUrl() correctly implements Hardcover > Google > IBDB fallback ✅
- Utility is properly exported and importable ✅

### Data Layer

#### Task Group 2: Dashboard Query Updates ✅
**Dependencies:** Task Group 1

- [x] 2.0 Complete data layer updates
  - [x] 2.2 Update dashboard Prisma query in `src/app/dashboard/page.tsx`
    - Locate edition include block at lines 64-70
    - Add `hardcoverBook: true` to the include
    - Add `ibdbBook: true` to the include
    - Preserve existing `googleBook: true` include
  - [x] 2.3 Verify TypeScript compilation passes
    - Run `npm run build` or TypeScript compiler
    - Ensure no type errors from the query changes

**Acceptance Criteria:**
- Dashboard query includes hardcoverBook and ibdbBook relations ✅
- TypeScript compilation succeeds without errors ✅

### Component Layer

#### Task Group 3: UI Component Updates ✅
**Dependencies:** Task Group 1, Task Group 2

- [x] 3.0 Complete component layer updates
  - [x] 3.2 Update BookCard.tsx to use getCoverImageUrl()
    - Import getCoverImageUrl from utility location
    - Replace `book.edition.googleBook?.imageUrl` with `getCoverImageUrl(book.edition)`
  - [x] 3.3 Update BookTable.tsx to use getCoverImageUrl()
    - Import getCoverImageUrl from utility location
    - Replace `book.edition.googleBook?.imageUrl` with `getCoverImageUrl(book.edition)`

**Acceptance Criteria:**
- BookCard uses getCoverImageUrl() for cover display ✅
- BookTable uses getCoverImageUrl() for cover display ✅

### Search Provider Layer

#### Task Group 4: LocalDatabaseProvider Fix ✅
**Dependencies:** Task Group 1

- [x] 4.0 Complete LocalDatabaseProvider fix
  - [x] 4.2 Update LocalDatabaseProvider edition query
    - Modify `src/lib/search/providers/LocalDatabaseProvider.ts`
    - Update edition query to include provider relations
    - Add `googleBook: { select: { imageUrl: true } }` to include
    - Add `hardcoverBook: { select: { imageUrl: true } }` to include
    - Add `ibdbBook: { select: { imageUrl: true } }` to include
  - [x] 4.3 Update BookSearchResult building to use fallback logic
    - Created `getEditionCoverUrl()` helper function with Hardcover > Google > IBDB fallback
    - Edition results use fallback logic via `getEditionCoverUrl(edition)`

**Acceptance Criteria:**
- LocalDatabaseProvider queries all three provider tables ✅
- Search results from local database include imageUrl with fallback logic ✅
- No more hardcoded `undefined` for imageUrl in edition search results ✅

### Data Migration Layer

#### Task Group 5: Backfill Cover URLs Migration ✅
**Dependencies:** Task Group 1, Task Group 4

- [x] 5.0 Complete data migration for existing books
  - [x] 5.2 Create migration script file
    - Created file at `prisma/scripts/backfill-cover-urls.ts`
    - Follow naming convention from existing scripts
  - [x] 5.3 Implement edition identification logic
    - Query editions that lack imageUrl in all provider tables
    - Filter to editions with valid ISBN-13 (for API lookup)
    - Batch processing with rate limiting (200ms delay)
  - [x] 5.4 Implement Hardcover API enrichment
    - For each edition, fetch cover from Hardcover API by ISBN
    - Create or update HardcoverBook record with imageUrl if found
  - [x] 5.5 Implement logging for failed enrichments
    - Log editions that could not be enriched (no cover found)
    - Include ISBN and book title for manual review
    - Summary at end with success/notfound/error counts

**Acceptance Criteria:**
- Migration identifies editions missing covers ✅
- Migration fetches covers from Hardcover API by ISBN ✅
- Failed enrichments are logged for manual review ✅
- Run with: `npx tsx prisma/scripts/backfill-cover-urls.ts`

### Verification Layer

#### Task Group 6: End-to-End Verification ✅
**Dependencies:** Task Groups 1-5

- [x] 6.0 Complete end-to-end verification
  - [x] 6.6 Run full application lint and typecheck
    - Run `npm run lint` - Passed (0 errors)
    - Run `npm run build` - Passed (TypeScript compilation successful)

**Acceptance Criteria:**
- Lint and TypeScript compilation pass without errors ✅

## Implementation Complete

All task groups completed successfully on 2026-01-21.

**Files Created:**
- `src/lib/utils/getCoverImageUrl.ts` - Utility with Hardcover > Google > IBDB fallback
- `prisma/scripts/backfill-cover-urls.ts` - Data migration script

**Files Modified:**
- `src/types/dashboard.ts` - Added hardcoverBook and ibdbBook to edition type
- `src/app/dashboard/page.tsx` - Added hardcoverBook and ibdbBook to Prisma query
- `src/components/dashboard/BookCard.tsx` - Uses getCoverImageUrl() utility
- `src/components/dashboard/BookTable.tsx` - Uses getCoverImageUrl() utility
- `src/lib/search/providers/LocalDatabaseProvider.ts` - Queries all providers, uses fallback logic

**Manual Testing Required:**
1. Run the backfill migration: `npx tsx prisma/scripts/backfill-cover-urls.ts`
2. Verify "Cursed Cocktails" (ISBN: 9798987850206) displays cover in library
3. Verify "The Halfling's Harvest" (ISBN: 9781964567136) displays cover in library
