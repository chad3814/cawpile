# Task Breakdown: Search Results Source Retention

## Overview
Total Tasks: 16

This feature adds source retention and cryptographic signing to search results. The implementation follows a bottom-up approach: types first, then utilities, then integration.

## Task List

### Type Definitions

#### Task Group 1: Type System Updates
**Dependencies:** None

- [x] 1.0 Complete type definitions
  - [x] 1.1 Add `SourceEntry` interface to `src/lib/search/types.ts`
    - Fields: `provider: string`, `data: SearchProviderResult`
    - Place after existing `SearchProviderResult` interface
  - [x] 1.2 Add `SignedBookSearchResult` interface to `src/lib/search/types.ts`
    - Extend `BookSearchResult` from `@/types/book`
    - Add `sources: SourceEntry[]` field
    - Add `signature?: string` field (optional for graceful failure)
  - [x] 1.3 Verify type exports are accessible
    - Ensure new types are exported from `src/lib/search/types.ts`
    - Check TypeScript compiles without errors: `npx tsc --noEmit`

**Acceptance Criteria:**
- `SourceEntry` interface defined with `provider` and `data` fields
- `SignedBookSearchResult` extends `BookSearchResult` with `sources` and `signature`
- TypeScript compilation passes

### Signing Utility

#### Task Group 2: Cryptographic Signing Implementation
**Dependencies:** Task Group 1

- [x] 2.0 Complete signing utility
  - [x] 2.1 Create `src/lib/search/utils/signResult.ts` with environment validation
    - Import Node.js `crypto` module
    - Read `SEARCH_SIGNING_SECRET` from `process.env`
    - Validate secret exists and is at least 32 characters
    - Log warning if secret missing or too short (follow pattern from `src/lib/s3.ts`)
  - [x] 2.2 Implement deterministic JSON stringification helper
    - Create `stableStringify()` function for consistent key ordering
    - Handle nested objects and arrays
    - Ensure same input always produces same string output
  - [x] 2.3 Implement `signResult()` function
    - Accept result object (without signature field)
    - Use `crypto.createHmac('sha256', secret)` pattern
    - Return hex-encoded signature string
    - Return `undefined` if signing fails (graceful degradation)
  - [x] 2.4 Implement `signResults()` batch function
    - Accept array of results to sign
    - Add `signature` field to each result
    - Return `SignedBookSearchResult[]`
  - [x] 2.5 Verify signing utility works correctly
    - Test that same input produces same signature
    - Test that different input produces different signature
    - Test graceful failure when secret is missing

**Acceptance Criteria:**
- Signing utility created at specified path
- HMAC-SHA256 algorithm used correctly
- Deterministic signatures (same input = same output)
- Graceful failure handling with console warnings

### Source Retention

#### Task Group 3: Result Merger Source Retention
**Dependencies:** Task Group 1

- [x] 3.0 Complete source retention in merger
  - [x] 3.1 Create helper function `buildSourcesArray()` in `resultMerger.ts`
    - Accept `allVersions: SearchProviderResult[]` array
    - Build `SourceEntry[]` sorted by `sourceWeight` (highest first)
    - Map each version to `{ provider: source, data: version }`
  - [x] 3.2 Modify `mergeResults()` to build sources array
    - In the map at lines 109-120, call `buildSourcesArray(allVersions)`
    - Store sources array alongside augmented result
    - Create intermediate type to hold both augmented result and sources
  - [x] 3.3 Update final result mapping to include sources
    - Modify lines 126-130 to include `sources` in output
    - Keep source metadata stripping for primary fields
    - Add sources array to each result object
  - [x] 3.4 Verify source retention works correctly
    - Test single-source results have sources array with one entry
    - Test merged results have multiple sources ordered by weight
    - Test sources contain original provider data

**Acceptance Criteria:**
- Each result includes `sources: SourceEntry[]` array
- Sources ordered by provider weight (highest first)
- Single-source results have one-entry sources array
- Original provider data preserved in source entries

### Integration

#### Task Group 4: Signing Integration and Type Updates
**Dependencies:** Task Groups 2, 3

- [x] 4.0 Complete integration
  - [x] 4.1 Import signing utility into `resultMerger.ts`
    - Import `signResults` from `./signResult`
  - [x] 4.2 Update `mergeResults()` return type
    - Change return type from `BookSearchResult[]` to `SignedBookSearchResult[]`
    - Update function signature
  - [x] 4.3 Apply signing to final results
    - After building results with sources, call `signResults()`
    - Sign happens after sources added but before returning
    - Handle case where signing returns undefined gracefully
  - [x] 4.4 Add `SEARCH_SIGNING_SECRET` to environment configuration
    - Document in `.env.example` if it exists
    - Add placeholder value for development
  - [x] 4.5 Verify end-to-end integration
    - Run `npm run build` to verify compilation
    - Run `npm run lint` to check for issues
    - Manual test: search returns results with `sources` and `signature` fields

**Acceptance Criteria:**
- `mergeResults()` returns `SignedBookSearchResult[]`
- Each result has both `sources` array and `signature` field
- Signing applied to all results including sources
- Build and lint pass without errors
- Existing search functionality unchanged

## Execution Order

Recommended implementation sequence:

1. **Type Definitions (Task Group 1)** - Foundation for all other work
2. **Signing Utility (Task Group 2)** - Can proceed in parallel with Task Group 3
3. **Source Retention (Task Group 3)** - Depends on types, parallel with signing
4. **Integration (Task Group 4)** - Brings together signing and source retention

## Files Modified

| File | Changes |
|------|---------|
| `src/lib/search/types.ts` | Add `SourceEntry` and `SignedBookSearchResult` interfaces |
| `src/lib/search/utils/signResult.ts` | New file: signing utility |
| `src/lib/search/utils/resultMerger.ts` | Add sources array, integrate signing |
| `.env.example` | Add `SEARCH_SIGNING_SECRET` placeholder |

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `SEARCH_SIGNING_SECRET` | HMAC key for signing results (min 32 chars) | Yes for signing |

## Notes

- No changes to `SearchOrchestrator.ts` required per spec
- No changes to individual search providers required
- Existing `BookSearchResult` interface remains unchanged for backward compatibility
- Consumers receive additional fields (`sources`, `signature`) alongside existing fields
