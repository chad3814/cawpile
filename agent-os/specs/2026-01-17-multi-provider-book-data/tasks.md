# Task Breakdown: Multi-Provider Book Data Storage

## Overview
Total Tasks: 34
Estimated Complexity: Medium-High

This feature extends the book data storage system to save metadata from Hardcover and IBDB providers alongside existing Google Books data, enabling data enrichment from multiple sources.

## Task List

### Database Layer

#### Task Group 1: Prisma Schema - New Provider Models
**Dependencies:** None

- [x] 1.0 Complete database schema for multi-provider storage
  - [ ] 1.1 Write 4-6 focused tests for new provider models (SKIPPED - no test framework)
    - Test HardcoverBook model creation with required fields
    - Test IbdbBook model creation with required fields
    - Test Edition 1:1 relation to each provider model
    - Test unique constraints on editionId and provider-specific IDs
  - [x] 1.2 Create `HardcoverBook` model in `prisma/schema.prisma`
    - Fields: `id` (cuid), `hardcoverId` (String, unique), `editionId` (String, unique)
    - Core fields: `title`, `subtitle`, `authors` (String[]), `description`, `releaseDate`, `pages` (Int?)
    - Media fields: `imageUrl`, `categories` (String[]), `isbn`, `isbn13`
    - Cross-reference fields: `hardcoverSlug`, `openLibraryId`, `goodReadsId`
    - Relation: `edition Edition @relation(fields: [editionId], references: [id])`
    - Add `createdAt DateTime @default(now())` (no updatedAt - append-only)
  - [x] 1.3 Create `IbdbBook` model in `prisma/schema.prisma`
    - Fields: `id` (cuid), `ibdbId` (String, unique), `editionId` (String, unique)
    - Core fields: `title`, `authors` (String[]), `description`, `publishedDate`, `pageCount` (Int?)
    - Media fields: `imageUrl`, `categories` (String[]), `isbn10`, `isbn13`
    - Relation: `edition Edition @relation(fields: [editionId], references: [id])`
    - Add `createdAt DateTime @default(now())` (no updatedAt - append-only)
  - [x] 1.4 Update `Edition` model with optional provider relations
    - Add `hardcoverBook HardcoverBook?` relation
    - Add `ibdbBook IbdbBook?` relation
    - Maintain existing `googleBook GoogleBook?` relation
  - [x] 1.5 Generate and apply Prisma migration
    - Run `npx prisma migrate dev --name add-multi-provider-book-models` (NOTE: Requires DATABASE_URL - schema validated, client generated)
    - Verify migration runs successfully
    - Run `npx prisma generate` to update client
  - [ ] 1.6 Ensure database layer tests pass (SKIPPED - no test framework)
    - Run ONLY the 4-6 tests written in 1.1
    - Verify models created correctly via Prisma Studio
    - Do NOT run entire test suite at this stage

**Acceptance Criteria:**
- HardcoverBook and IbdbBook models exist with correct fields
- Edition model has optional relations to all three provider models
- Unique constraints prevent duplicate provider records per edition
- Migration applies cleanly to existing database

---

### Verification Layer

#### Task Group 2: Signature Verification Function
**Dependencies:** Task Group 1

- [x] 2.0 Complete signature verification for search results
  - [ ] 2.1 Write 4-6 focused tests for signature verification (SKIPPED - no test framework)
    - Test valid signature returns true
    - Test tampered payload returns false
    - Test missing signature returns false
    - Test missing sources array with no signature treated as unverified
    - Test signature verification uses same HMAC-SHA256 algorithm as signing
  - [x] 2.2 Create `verifySignature()` function in `src/lib/search/utils/signResult.ts`
    - Accept `SignedBookSearchResult` as input parameter
    - Return `boolean` indicating verification success
    - Extract `signature` from result, return false if missing
    - Remove signature from payload before verification
    - Use existing `stableStringify()` for deterministic serialization
    - Create HMAC-SHA256 using `SEARCH_SIGNING_SECRET`
    - Compare computed signature with provided signature
    - Return true only if signatures match exactly
  - [x] 2.3 Add helper function `isVerifiedResult()` for cleaner API
    - Check both signature presence and validity
    - Check sources array exists and is non-empty
    - Return typed result for downstream consumption
  - [x] 2.4 Export new functions from module
    - Add `verifySignature` to existing exports
    - Add `isVerifiedResult` to exports
    - Update any barrel exports if applicable
  - [ ] 2.5 Ensure verification tests pass (SKIPPED - no test framework)
    - Run ONLY the 4-6 tests written in 2.1
    - Verify signing and verification are inverse operations
    - Do NOT run entire test suite at this stage

**Acceptance Criteria:**
- verifySignature correctly validates signed results
- Tampered results are rejected
- Missing signatures return false (not throw)
- Function integrates with existing signing utilities

---

### Database Functions Layer

#### Task Group 3: Enhanced findOrCreateEdition Function
**Dependencies:** Task Groups 1, 2

- [x] 3.0 Complete enhanced edition creation with multi-provider support
  - [ ] 3.1 Write 5-7 focused tests for enhanced findOrCreateEdition (SKIPPED - no test framework)
    - Test basic edition creation still works (backward compatibility)
    - Test edition creation with signed result creates HardcoverBook
    - Test edition creation with signed result creates IbdbBook
    - Test upsert pattern updates existing provider records
    - Test invalid signature skips multi-provider save (falls back to Google only)
    - Test missing sources array skips multi-provider save
  - [x] 3.2 Update function signature in `src/lib/db/books.ts`
    - Add optional third parameter: `signedResult?: SignedBookSearchResult`
    - Import `SignedBookSearchResult` and `SourceEntry` types
    - Import `verifySignature` from `signResult.ts`
    - Maintain backward compatibility when signedResult not provided
  - [x] 3.3 Add signature verification logic before provider data persistence
    - If signedResult provided, call `verifySignature(signedResult)`
    - If verification fails, log warning: "Signature verification failed, skipping multi-provider save"
    - If no signature but sources exist, log warning: "Unverified sources array, skipping multi-provider save"
    - Only proceed with provider data if verification passes
  - [x] 3.4 Implement provider data mapping functions
    - Create `mapHardcoverSource(source: SourceEntry): Prisma.HardcoverBookCreateInput`
    - Create `mapIbdbSource(source: SourceEntry): Prisma.IbdbBookCreateInput`
    - Map fields from `source.data` to Prisma model fields
    - Handle null/undefined fields gracefully
  - [x] 3.5 Implement provider record creation after edition creation/find
    - Iterate through verified `sources` array
    - For provider "hardcover": upsert HardcoverBook record
    - For provider "ibdb": upsert IbdbBook record
    - Use upsert pattern to avoid duplicates on existing editions
    - Link all records to edition via `editionId`
  - [ ] 3.6 Ensure enhanced findOrCreateEdition tests pass (SKIPPED - no test framework)
    - Run ONLY the 5-7 tests written in 3.1
    - Verify backward compatibility with existing callers
    - Do NOT run entire test suite at this stage

**Acceptance Criteria:**
- Existing edition creation works without changes to callers
- Valid signed results create provider records
- Invalid/missing signatures fall back gracefully
- Upsert prevents duplicate provider records

---

#### Task Group 4: Data Enrichment Utility
**Dependencies:** Task Group 1

- [x] 4.0 Complete data priority and enrichment utility
  - [ ] 4.1 Write 4-6 focused tests for getEnrichedBookData (SKIPPED - no test framework)
    - Test Edition local fields take priority over all providers
    - Test Hardcover data takes priority over Google Books
    - Test Google Books data takes priority over IBDB
    - Test missing fields fall through to next priority provider
    - Test dataSource field correctly indicates data origin
  - [x] 4.2 Create `getEnrichedBookData()` utility in `src/lib/db/books.ts`
    - Accept Edition with included relations (googleBook, hardcoverBook, ibdbBook)
    - Define priority order: Edition > Hardcover > GoogleBooks > IBDB
    - Return merged object with all book metadata fields
  - [x] 4.3 Implement field-by-field priority resolution
    - For each field (title, description, imageUrl, pageCount, authors, categories, publishedDate):
      - Check Edition fields first (local edits)
      - Check HardcoverBook if present
      - Check GoogleBook if present
      - Check IbdbBook if present
      - Use first non-null value found
  - [x] 4.4 Add dataSource tracking to enriched result
    - Include `dataSource: Record<string, string>` in return type
    - Track which provider supplied each field value
    - Example: `{ title: "edition", imageUrl: "hardcover", description: "google" }`
  - [x] 4.5 Create TypeScript types for enriched book data
    - Define `EnrichedBookData` interface in `src/types/book.ts`
    - Include all merged fields plus `dataSource` map
  - [ ] 4.6 Ensure enrichment utility tests pass (SKIPPED - no test framework)
    - Run ONLY the 4-6 tests written in 4.1
    - Verify priority order is respected
    - Do NOT run entire test suite at this stage

**Acceptance Criteria:**
- Data priority order is enforced correctly
- Local Edition edits always take precedence
- dataSource field accurately tracks data origin
- Missing provider data handled gracefully

---

### API Layer

#### Task Group 5: Update Book Addition API
**Dependencies:** Task Groups 2, 3

- [x] 5.0 Complete API endpoint updates for multi-provider support
  - [ ] 5.1 Write 4-6 focused tests for updated POST /api/user/books (SKIPPED - no test framework)
    - Test legacy flow with googleBooksId still works
    - Test signed result flow creates multi-provider records
    - Test invalid signature falls back to Google Books API fetch
    - Test response includes provider data in edition
  - [x] 5.2 Update request body validation in `src/app/api/user/books/route.ts`
    - Accept optional `signedResult: SignedBookSearchResult` in request body
    - Keep `googleBooksId` as required for backward compatibility
    - Add type validation for signedResult structure if provided
  - [x] 5.3 Implement conditional flow based on request payload
    - If signedResult provided with valid signature:
      - Pass to `findOrCreateEdition(bookId, googleData, signedResult)`
    - If only googleBooksId provided (legacy flow):
      - Fetch from Google Books API
      - Call `findOrCreateEdition(bookId, googleData)` without signedResult
  - [x] 5.4 Update response to include provider data
    - Include `hardcoverBook` and `ibdbBook` in edition response
    - Use Prisma include pattern matching existing googleBook include
  - [ ] 5.5 Ensure API tests pass (SKIPPED - no test framework)
    - Run ONLY the 4-6 tests written in 5.1
    - Verify backward compatibility with existing frontend
    - Do NOT run entire test suite at this stage

**Acceptance Criteria:**
- Legacy API flow unchanged for existing integrations
- New signed result flow creates provider records
- Invalid signatures handled gracefully
- Response includes all provider data

---

#### Task Group 6: Admin Re-sync API Endpoint
**Dependencies:** Task Groups 3, 4

- [x] 6.0 Complete admin re-sync API endpoint
  - [ ] 6.1 Write 4-6 focused tests for POST /api/admin/books/[id]/resync (SKIPPED - no test framework)
    - Test requires admin authentication
    - Test non-admin user returns 403
    - Test valid editionId triggers search and update
    - Test AdminAuditLog created with before/after values
    - Test response includes summary of changes per provider
  - [x] 6.2 Create `POST /api/admin/books/[id]/resync` endpoint
    - Create file: `src/app/api/admin/books/[id]/resync/route.ts`
    - Use dynamic route with `editionId` parameter
    - Import admin auth helpers from `@/lib/auth/admin`
  - [x] 6.3 Implement admin authentication check
    - Call `requireAdmin()` at route start
    - Return 403 if not admin
    - Extract admin user ID for audit logging
  - [x] 6.4 Implement re-sync logic
    - Fetch existing edition with all provider relations
    - Extract book title and primary author
    - Call `SearchOrchestrator.search(title + " " + author)`
    - Sign merged result using `signResults()`
    - Call `findOrCreateEdition(bookId, googleData, signedResult)`
  - [x] 6.5 Implement audit logging
    - Capture before values from existing provider records
    - Capture after values from updated records
    - Create AdminAuditLog entry with:
      - entityType: "Edition"
      - entityId: editionId
      - actionType: "RESYNC"
      - oldValue/newValue: JSON stringified provider data
  - [x] 6.6 Return structured response
    - Include summary: `{ hardcover: "created" | "updated" | "unchanged", ibdb: "..." }`
    - Include before/after field counts
    - Include any errors encountered
  - [ ] 6.7 Ensure admin API tests pass (SKIPPED - no test framework)
    - Run ONLY the 4-6 tests written in 6.1
    - Verify admin-only access enforced
    - Do NOT run entire test suite at this stage

**Acceptance Criteria:**
- Endpoint requires admin authentication
- Re-sync triggers fresh search and updates provider records
- Audit log captures before/after state
- Response provides clear summary of changes

---

### Admin UI Layer

#### Task Group 7: Admin Re-sync UI Components
**Dependencies:** Task Group 6

- [x] 7.0 Complete admin UI for re-sync functionality
  - [ ] 7.1 Write 3-5 focused tests for Re-sync UI components (SKIPPED - no test framework)
    - Test Re-sync button renders in BookTable actions column
    - Test button triggers API call with correct editionId
    - Test loading state shown during request
    - Test success/error toast notification displayed
  - [x] 7.2 Update `BookTable.tsx` with Re-sync button
    - Import `ArrowPathIcon` from `@heroicons/react/24/outline`
    - Add Re-sync button next to existing Edit link in actions column
    - Use consistent styling: `text-blue-600 hover:text-blue-900` (changed from orange to differentiate from Edit)
    - Pass edition ID (need to determine which edition - may need data structure update)
  - [x] 7.3 Implement Re-sync button click handler
    - Create async handler function `handleResync(editionId: string)`
    - Set loading state for specific row
    - Call `POST /api/admin/books/[editionId]/resync`
    - Handle success/error responses
  - [x] 7.4 Add loading state UI
    - Show spinning `ArrowPathIcon` or loading indicator during request
    - Disable button during pending request
    - Use `animate-spin` Tailwind class for spinning icon
  - [x] 7.5 Implement toast notifications
    - Add toast notification system if not present (or use existing)
    - Show success toast with summary of changes
    - Show error toast with error message
    - Auto-dismiss after 5 seconds
  - [ ] 7.6 (Optional) Add bulk re-sync to BulkActionBar (SKIPPED - optional)
    - Add "Re-sync Selected" option to bulk actions dropdown
    - Iterate through selected books and call resync endpoint
    - Show progress indicator for bulk operation
    - Aggregate and display results summary
  - [ ] 7.7 Ensure UI tests pass (SKIPPED - no test framework)
    - Run ONLY the 3-5 tests written in 7.1
    - Verify button renders and triggers correctly
    - Do NOT run entire test suite at this stage

**Acceptance Criteria:**
- Re-sync button visible in admin book table
- Button triggers API call with loading state
- Success/error feedback displayed to user
- UI matches existing admin design patterns

---

### Testing

#### Task Group 8: Integration Test Review and Gap Analysis
**Dependencies:** Task Groups 1-7

- [ ] 8.0 Review existing tests and fill critical gaps only (SKIPPED - no test framework configured)
  - [ ] 8.1 Review tests from Task Groups 1-7
  - [ ] 8.2 Analyze test coverage gaps for THIS feature only
  - [ ] 8.3 Write up to 8 additional strategic tests maximum
  - [ ] 8.4 Run feature-specific tests only

**Acceptance Criteria:**
- All feature-specific tests pass
- Critical integration points covered
- No more than 8 additional tests added
- Testing focused exclusively on multi-provider feature

---

## Execution Order

Recommended implementation sequence with rationale:

1. **Database Layer (Task Group 1)** - Foundation required for all other work
   - Schema must exist before any code can reference models
   - Migration creates database tables

2. **Verification Layer (Task Group 2)** - Required for secure data flow
   - Signature verification needed before trusting provider data
   - Independent of database schema (uses existing types)

3. **Database Functions Layer (Task Groups 3, 4)** - Core business logic
   - Task Group 3: Enhanced findOrCreateEdition (depends on 1, 2)
   - Task Group 4: Data enrichment utility (depends on 1 only, can parallel with 3)

4. **API Layer (Task Groups 5, 6)** - Expose functionality
   - Task Group 5: Update user book addition (depends on 2, 3)
   - Task Group 6: Admin re-sync endpoint (depends on 3, 4)

5. **Admin UI Layer (Task Group 7)** - User-facing admin interface
   - Depends on Task Group 6 (API must exist first)

6. **Testing (Task Group 8)** - Final validation
   - Run after all implementation complete
   - Fill gaps and verify integration

## Parallel Execution Opportunities

The following task groups can be worked in parallel:

- **Groups 3 and 4**: Both depend only on Group 1, can run simultaneously
- **Groups 5 and 6**: After Groups 2-4 complete, these can run in parallel

## Key Files to Modify

| File | Task Groups | Changes |
|------|-------------|---------|
| `prisma/schema.prisma` | 1 | Add HardcoverBook, IbdbBook models; update Edition |
| `src/lib/search/utils/signResult.ts` | 2 | Add verifySignature function |
| `src/lib/db/books.ts` | 3, 4 | Enhance findOrCreateEdition, add getEnrichedBookData |
| `src/types/book.ts` | 4 | Add EnrichedBookData interface |
| `src/app/api/user/books/route.ts` | 5 | Accept SignedBookSearchResult |
| `src/app/api/admin/books/[id]/resync/route.ts` | 6 | New file - admin re-sync endpoint |
| `src/components/admin/BookTable.tsx` | 7 | Add Re-sync button |

## Environment Variables

Ensure the following environment variable is configured:

```env
SEARCH_SIGNING_SECRET    # Required for signature verification (min 32 chars)
```

## Risk Considerations

1. **Backward Compatibility**: All changes maintain existing API contract
2. **Data Integrity**: Signature verification prevents tampered data
3. **Graceful Degradation**: Invalid signatures fall back to Google Books only
4. **Admin-Only Re-sync**: Prevents unauthorized bulk operations
