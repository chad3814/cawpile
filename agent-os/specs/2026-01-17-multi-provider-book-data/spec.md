# Specification: Multi-Provider Book Data Storage

## Goal
Extend the book data storage system to save metadata from Hardcover and IBDB providers alongside the existing Google Books data, linking all provider records to the Edition model and enabling data enrichment from multiple sources.

## User Stories
- As a user, I want book data to be enriched from multiple sources so that I have more complete metadata (covers, descriptions, page counts) even when one provider lacks information.
- As an admin, I want to re-sync existing books with fresh provider data so that older entries can benefit from the multi-provider system.

## Specific Requirements

**New Prisma Models for Provider Data**
- Create `HardcoverBook` model mirroring `GoogleBook` structure with fields: `id`, `hardcoverId`, `editionId`, `title`, `subtitle`, `authors`, `description`, `releaseDate`, `pages`, `imageUrl`, `categories`, `isbn`, `isbn13`
- Add cross-reference fields to `HardcoverBook`: `hardcoverSlug`, `openLibraryId`, `goodReadsId` for future linking
- Create `IbdbBook` model with fields: `id`, `ibdbId`, `editionId`, `title`, `authors`, `description`, `publishedDate`, `pageCount`, `imageUrl`, `categories`, `isbn10`, `isbn13`
- Both models have 1:1 relation to `Edition` (matching `GoogleBook` pattern)
- Add `hardcoverBook` and `ibdbBook` optional relations to `Edition` model
- Use `@unique` constraint on `editionId` and provider-specific IDs

**Signature Verification Before Saving**
- Create `verifySignature()` function in `src/lib/search/utils/signResult.ts` that takes a `SignedBookSearchResult` and returns boolean
- Before persisting provider data, verify the signature matches the payload using HMAC-SHA256
- If signature verification fails, log a warning and skip saving the signed sources (fall back to Google Books API fetch only)
- If no signature present but `sources` array exists, treat as unverified and skip multi-provider save

**Update findOrCreateEdition Function**
- Modify `src/lib/db/books.ts` to accept optional `SignedBookSearchResult` with verified sources
- Add new signature parameter: `findOrCreateEdition(bookId, googleData, signedResult?)`
- After creating/finding edition, iterate through verified `sources` array
- For each source with provider "hardcover", create `HardcoverBook` record if not exists
- For each source with provider "ibdb", create `IbdbBook` record if not exists
- Use upsert pattern to avoid duplicates when edition already has provider data

**Update Book Addition API Endpoint**
- Modify `POST /api/user/books` to accept `SignedBookSearchResult` instead of just `googleBooksId`
- If signed result provided with valid signature, pass to `findOrCreateEdition`
- If only `googleBooksId` provided (legacy flow), continue with existing Google Books API fetch
- This maintains backward compatibility with any existing integrations

**Data Priority Logic for Display**
- Create `getEnrichedBookData()` utility in `src/lib/db/books.ts`
- Priority order: Local edits (Edition fields) > Hardcover > Google Books > IBDB
- For each field (title, description, imageUrl, pageCount, etc.), return first non-null value following priority
- Return merged object with `dataSource` field indicating which provider supplied each value

**Admin Re-sync API Endpoint**
- Create `POST /api/admin/books/[id]/resync` endpoint
- Accepts `editionId` in URL, requires admin authentication
- Performs fresh search using book title + primary author via `SearchOrchestrator`
- Signs the merged result and calls `findOrCreateEdition` with the signed result
- Updates existing provider records via upsert, preserving local edits
- Returns summary of what was updated from each provider
- Log action to `AdminAuditLog` with before/after values

**Admin Re-sync UI Button**
- Add "Re-sync" button/link to `BookTable.tsx` actions column
- Button triggers `POST /api/admin/books/[editionId]/resync`
- Show loading spinner during request
- Display success/error toast notification with summary of changes
- Optionally add bulk re-sync action to `BulkActionBar` for multiple books

## Existing Code to Leverage

**GoogleBook Model Pattern (`prisma/schema.prisma`)**
- Follow exact same structure: `id`, unique `editionId`, 1:1 relation to Edition
- Use same field types (String, Int?, String[], DateTime @default(now()))
- Mirror the `createdAt` timestamp pattern without `updatedAt` (provider data is append-only)

**findOrCreateEdition in `src/lib/db/books.ts`**
- Currently creates GoogleBook in nested `create` during edition creation
- Extend to conditionally create HardcoverBook and IbdbBook using same pattern
- Reuse the `whereConditions` ISBN/ID matching logic for finding existing editions

**signResult.ts Signing Utilities**
- `stableStringify()` function for deterministic JSON serialization already exists
- `signResult()` creates HMAC-SHA256 signature - use same secret for verification
- Add inverse `verifySignature(result)` function using identical algorithm

**HardcoverClient and IbdbClient Types**
- `HardcoverBook` interface in `hardcoverClient.ts` defines all available fields
- `IbdbBook` interface in `ibdbClient.ts` defines available fields
- Map these interfaces to new Prisma model fields during creation

**BookTable.tsx Admin Component**
- Actions column already has Edit link pattern to follow
- Add Re-sync button using same styling (`text-orange-600 hover:text-orange-900`)
- Use HeroIcons `ArrowPathIcon` for the re-sync action

## Out of Scope
- OpenLibrary as a new search provider (future enhancement)
- User-facing UI to select preferred data provider
- Analytics tracking which provider supplied which data
- Local image hosting or cover image caching
- Automatic scheduled re-sync of all books
- User-initiated re-sync (admin only)
- Editing provider-specific data directly (only local Edition fields editable)
- Migration of existing books to multi-provider (manual re-sync only)
- Deduplication logic changes to the search result merger
- Provider weight or priority configuration UI
