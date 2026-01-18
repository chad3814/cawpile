# Specification: Search Results Source Retention

## Goal

Update the `/api/books/search` endpoint to retain individual source results from each provider within merged results and add cryptographic signing to each search result entry for future integrity verification.

## User Stories

- As a developer, I want search results to include the original data from each contributing provider so that future features can display source-specific information
- As the system, I want each search result signed cryptographically so that result integrity can be verified by downstream consumers

## Specific Requirements

**Retain source data during merge**
- Modify `mergeResults()` in `src/lib/search/utils/resultMerger.ts` to preserve original provider results
- Store each contributing source's raw `SearchProviderResult` in a `sources` array on the merged result
- Include provider name and original data for each source entry
- Maintain current merging/deduplication logic for primary fields (title, authors, isbn, etc.)

**Sources array structure**
- Each merged result includes a `sources: SourceEntry[]` array
- `SourceEntry` contains `provider: string` (e.g., "google", "hardcover", "local", "ibdb") and `data: SearchProviderResult`
- Single-source results also include a `sources` array with one entry for consistent structure
- Sources ordered by provider weight (highest first) within the array

**Add cryptographic signing**
- Create signing utility at `src/lib/search/utils/signResult.ts`
- Use Node.js `crypto` module with HMAC-SHA256 algorithm
- Sign the JSON stringified result (excluding the signature field itself) with a secret from environment
- Add `SEARCH_SIGNING_SECRET` environment variable for the signing key
- Signature added as `signature: string` field on each result entry

**Update type definitions**
- Add `SourceEntry` interface to `src/lib/search/types.ts`
- Create new `SignedBookSearchResult` interface extending `BookSearchResult` with `sources` and `signature` fields
- Update `mergeResults()` return type to `SignedBookSearchResult[]`
- Keep existing `BookSearchResult` interface unchanged for backward compatibility

**Signing implementation details**
- Sign result BEFORE adding signature field (signature covers all other fields including sources)
- Use deterministic JSON stringification to ensure consistent signatures
- Handle signing failure gracefully (log error, return result without signature)
- Secret must be at least 32 characters; warn in console if missing or too short

**Integration with SearchOrchestrator**
- No changes required to `SearchOrchestrator.ts` - signing happens in `mergeResults()`
- API route continues to return results; new fields automatically included
- Existing consumers receive additional fields but core BookSearchResult fields unchanged

## Existing Code to Leverage

**`src/lib/search/utils/resultMerger.ts`**
- Contains `MergedResult` interface with `primary` and `duplicates` arrays
- Already groups all matching results before selecting primary
- Lines 109-119 have access to all versions before stripping metadata
- Modify to build `sources` array from `allVersions` before final return

**`src/lib/search/BaseSearchProvider.ts`**
- Already attaches `source` and `sourceWeight` to each result (lines 28-32)
- This metadata flows through to `mergeResults()` and is currently stripped
- No changes needed; existing metadata sufficient for building sources array

**`src/lib/search/types.ts`**
- `SearchProviderResult` extends `BookSearchResult` with `source` and `sourceWeight`
- Add new types here alongside existing interfaces
- Pattern follows existing type organization

**Node.js crypto module**
- Standard library, no additional dependencies needed
- `createHmac('sha256', secret).update(data).digest('hex')` pattern
- Project already uses Node.js APIs in other server-side code

**Environment variable pattern**
- Project uses `process.env` directly (see `src/lib/s3.ts` for pattern)
- Add `SEARCH_SIGNING_SECRET` alongside existing secrets
- Document in project README or environment example file

## Out of Scope

- UI changes to display source information (future feature)
- Signature verification endpoint or middleware
- Caching of signed results
- Provider-specific signing (all providers signed uniformly)
- Encryption of results (signing only, not encryption)
- Changes to individual search providers
- Performance optimization of signing (baseline implementation only)
- Exposing signing secret rotation mechanism
- Admin interface for viewing/managing signatures
- Client-side signature verification utilities
