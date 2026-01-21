# Specification: Missing Covers Bug Fix

## Goal
Ensure book covers displayed in search results appear consistently in the user's library by implementing multi-provider fallback logic and fixing data retrieval gaps.

## User Stories
- As a user, I want to see book covers in my library that were visible when I added the book from search results, so that my library looks complete and visually consistent.
- As a user adding books that only have covers from Hardcover or IBDB providers, I want those covers to display in my library instead of showing "No Cover."

## Specific Requirements

**Update Dashboard Data Fetching to Include All Provider Relations**
- Modify the dashboard page query to include `hardcoverBook` and `ibdbBook` relations alongside `googleBook`
- Query path: `src/app/dashboard/page.tsx` lines 64-70 currently only include `googleBook`
- Add `hardcoverBook: true` and `ibdbBook: true` to the edition include block
- This enables downstream components to access cover URLs from all providers

**Update DashboardBookData Type to Support Multi-Provider Images**
- Extend `DashboardBookData` interface in `src/types/dashboard.ts` to include `hardcoverBook` and `ibdbBook` relations
- Each provider relation should include `imageUrl` field (nullable string)
- Structure: `edition.hardcoverBook: { imageUrl: string | null } | null`
- Structure: `edition.ibdbBook: { imageUrl: string | null } | null`

**Create Utility Function for Cover URL Fallback**
- Create `getCoverImageUrl()` utility function in `src/lib/utils/` or similar location
- Implement fallback order: Hardcover > Google > IBDB
- Accept edition object with all three provider relations
- Return first non-null imageUrl found, or undefined if none available

**Update BookCard Component to Use Fallback Logic**
- Modify `src/components/dashboard/BookCard.tsx` line 64 to use the new utility function
- Replace `book.edition.googleBook?.imageUrl` with `getCoverImageUrl(book.edition)`
- Apply same change to BookDetailsModal imageUrl prop (line 579)

**Update BookTable Component to Use Fallback Logic**
- Modify `src/components/dashboard/BookTable.tsx` line 78 to use the new utility function
- Replace `book.edition.googleBook?.imageUrl` with `getCoverImageUrl(book.edition)`
- Both mobile and desktop layouts use the same `imageUrl` variable, so single fix applies to both

**Fix LocalDatabaseProvider to Return Image URLs**
- Modify `src/lib/search/providers/LocalDatabaseProvider.ts` to query provider tables
- Include `googleBook`, `hardcoverBook`, and `ibdbBook` relations in the edition query (lines 32-49)
- Apply fallback logic when building `BookSearchResult`: hardcover > google > ibdb imageUrl
- Currently hardcodes `imageUrl: undefined` on lines 67 and 89

**Create Data Migration for Existing Books with Missing Covers**
- Create Prisma migration script to backfill cover URLs for existing editions
- For each edition missing provider records, attempt to fetch from Hardcover API by ISBN
- Log editions that could not be enriched for manual review
- Run as a one-time migration, not a schema change

**Test with Specific Books**
- Verify fix with "Cursed Cocktails" ISBN-13: 9798987850206
- Verify fix with "The Halfling's Harvest" ISBN-13: 9781964567136
- Both books should display covers in library after fix is applied

## Existing Code to Leverage

**getEnrichedBookData() in src/lib/db/books.ts**
- Already implements multi-provider fallback logic for imageUrl (lines 416-421)
- Priority order: Edition > Hardcover > Google > IBDB
- Can be referenced as pattern for the new utility function
- Includes dataSource tracking which may be useful for debugging

**Dashboard Query Pattern in src/app/dashboard/page.tsx**
- Existing include structure for edition relations (lines 64-70)
- Simply needs `hardcoverBook: true` and `ibdbBook: true` added
- Query already uses `cawpileRating` and `sharedReview` includes as examples

**HardcoverProvider.ts and IbdbProvider.ts**
- Show how other providers extract and return imageUrl from API responses
- HardcoverProvider uses `book.image?.url` (line 36)
- Pattern for normalizing different API response structures

**Prisma Migration Pattern in prisma/migrations/**
- Existing migrations show both schema changes and data transformations
- `20260120111131_set_finish_date_for_dnf_books` is a recent data migration example
- Follow same directory structure and naming convention

## Out of Scope
- Bad cover quality detection or replacement (future feature)
- Cover image caching or optimization
- User-uploaded custom covers
- Cover aspect ratio normalization
- Automated cover re-fetching on a schedule
- Admin tools for managing book covers
- Cover image CDN or proxy implementation
- Fallback placeholder image customization
- Provider preference settings per user
- Search result merging logic modifications (confirmed out of scope)
