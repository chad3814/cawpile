# Dev Session Plan: Additional Search Providers

## Overview

This plan breaks down the implementation of multiple search providers for the book search functionality into small, iterative steps that build on each other. Each phase is designed to maintain a working system while progressively adding capabilities.

## Implementation Phases

### Phase 1: Foundation - Provider Architecture
Create the base infrastructure for the provider system without breaking existing functionality.

### Phase 2: Local Database Provider
Implement the local database search as the first provider while maintaining Google Books separately.

### Phase 3: Provider Integration Layer
Create the orchestration layer that manages multiple providers and merges results.

### Phase 4: External Providers
Add IBDB and Hardcover providers one at a time.

### Phase 5: Final Integration
Wire everything together and replace the existing search implementation.

---

## Detailed Step-by-Step Implementation

### Step 1: Create Provider Interface and Base Classes

**Goal**: Establish the contract for all search providers.

**Files to create**:
- `src/lib/search/types.ts` - Define interfaces and types
- `src/lib/search/BaseSearchProvider.ts` - Abstract base class

**Implementation**:
1. Define `SearchProvider` interface with required methods
2. Define `SearchProviderResult` type extending `BookSearchResult` with source metadata
3. Create abstract `BaseSearchProvider` class with timeout handling
4. Add provider registration types

---

### Step 2: Implement Local Database Provider

**Goal**: Create the first concrete provider for searching the local database.

**Files to create**:
- `src/lib/search/providers/LocalDatabaseProvider.ts`

**Implementation**:
1. Import Prisma client and types
2. Implement search method for Books and Editions tables
3. Add partial matching logic for title and authors
4. Normalize results to `BookSearchResult` format
5. Set weight to highest priority (10)

---

### Step 3: Create Result Merger Utility

**Goal**: Build the logic for deduplicating and merging results from multiple sources.

**Files to create**:
- `src/lib/search/utils/resultMerger.ts`
- `src/lib/search/utils/fuzzyMatch.ts`

**Implementation**:
1. Create ISBN-based deduplication logic
2. Implement fuzzy author matching using string similarity
3. Build result merging with data augmentation
4. Add sorting by provider weight
5. Create result limiting logic

---

### Step 4: Refactor Google Books as a Provider

**Goal**: Convert existing Google Books implementation to provider pattern.

**Files to create**:
- `src/lib/search/providers/GoogleBooksProvider.ts`

**Implementation**:
1. Wrap existing `searchBooks` function
2. Implement provider interface
3. Add weight (5) and timeout configuration
4. Handle errors gracefully

---

### Step 5: Create Search Orchestrator

**Goal**: Build the main coordinator that executes all providers in parallel.

**Files to create**:
- `src/lib/search/SearchOrchestrator.ts`

**Implementation**:
1. Create provider registry
2. Implement parallel search execution with Promise.allSettled
3. Add timeout wrapper for each provider
4. Collect and merge results
5. Handle partial failures silently

---

### Step 6: Implement IBDB Provider

**Goal**: Add IBDB as an external search provider.

**Files to create**:
- `src/lib/search/providers/IBDBProvider.ts`
- `src/lib/search/utils/ibdbClient.ts`

**Implementation**:
1. Create HTTP client for IBDB API
2. Implement search method with proper URL encoding
3. Parse and normalize IBDB response format
4. Set weight to 4
5. Add error handling for network failures

---

### Step 7: Explore and Implement Hardcover Provider

**Goal**: Add Hardcover GraphQL search provider.

**Files to create**:
- `src/lib/search/providers/HardcoverProvider.ts`
- `src/lib/search/utils/hardcoverClient.ts`

**Implementation**:
1. Create GraphQL client with bearer token auth
2. Explore and define search query structure
3. Parse GraphQL response and normalize
4. Set weight to 6
5. Handle GraphQL-specific errors

---

### Step 8: Update Search API Endpoint

**Goal**: Replace the existing search implementation with the orchestrator.

**Files to modify**:
- `src/app/api/books/search/route.ts`

**Implementation**:
1. Import SearchOrchestrator
2. Register all providers
3. Replace direct Google Books call with orchestrator
4. Maintain exact same response format
5. Ensure backwards compatibility

---

### Step 9: Testing and Validation

**Goal**: Ensure the system works correctly with all providers.

**Implementation**:
1. Test each provider individually
2. Test deduplication logic
3. Test parallel execution and timeouts
4. Test partial failure scenarios
5. Verify response format compatibility

---

## Implementation Prompts for Code Generation

### Prompt 1: Provider Architecture Foundation

```
Create the base architecture for a multi-source book search system.

Create src/lib/search/types.ts with:
- SearchProvider interface with methods: search(query: string, limit: number): Promise<BookSearchResult[]>, and properties: name, weight, timeout
- SearchProviderResult type that extends BookSearchResult with source field
- ProviderConfig interface with registration details

Create src/lib/search/BaseSearchProvider.ts with:
- Abstract class implementing SearchProvider
- Built-in timeout handling using Promise.race
- Error handling that returns empty array on failure
- Constructor accepting name, weight, and optional timeout

Use the existing BookSearchResult type from src/types/book.ts.
```

### Prompt 2: Local Database Provider Implementation

```
Implement a local database search provider that searches Books and Editions tables.

Create src/lib/search/providers/LocalDatabaseProvider.ts:
- Extends BaseSearchProvider with weight 10 (highest priority)
- Search both Books and Editions tables using Prisma
- Implement partial matching on title and authors fields using contains/mode: 'insensitive'
- Combine results from both tables, avoiding duplicates
- Return only title, authors, and ISBN data (no user-specific data)
- Normalize to BookSearchResult format

Import Prisma client from src/lib/prisma.ts.
```

### Prompt 3: Result Merger and Fuzzy Matching

```
Create utilities for merging and deduplicating search results from multiple sources.

Create src/lib/search/utils/fuzzyMatch.ts:
- Function to calculate string similarity (Levenshtein distance or similar)
- Function to fuzzy match author names (handle "John Smith" vs "Smith, John")
- Threshold-based matching (e.g., 80% similarity)

Create src/lib/search/utils/resultMerger.ts:
- mergeResults function accepting array of SearchProviderResult arrays
- Deduplicate by ISBN (exact match) first
- Then deduplicate by title + fuzzy author match
- For duplicates: keep highest weight source as primary, augment missing fields from others
- Sort final results by source weight
- Limit to requested number of results
```

### Prompt 4: Google Books Provider Wrapper

```
Convert the existing Google Books implementation to a provider.

Create src/lib/search/providers/GoogleBooksProvider.ts:
- Extends BaseSearchProvider with weight 5
- Wrapper around existing searchBooks function from src/lib/googleBooks.ts
- Add source: 'google' to each result
- Maintain all existing functionality
- Handle errors by returning empty array
```

### Prompt 5: Search Orchestrator Implementation

```
Create the main orchestrator that coordinates all search providers.

Create src/lib/search/SearchOrchestrator.ts:
- Class with registerProvider and search methods
- Store providers in a Map or array
- search method:
  - Execute all providers in parallel using Promise.allSettled
  - Apply 5-second timeout to each provider
  - Collect successful results (ignore failures)
  - Pass results to resultMerger
  - Return merged and limited results
- Handle edge cases: no providers, all fail, empty results
```

### Prompt 6: IBDB Provider Implementation

```
Implement IBDB book search provider.

Create src/lib/search/utils/ibdbClient.ts:
- Simple HTTP client using fetch
- Base URL: https://ibdb.dev
- No authentication required

Create src/lib/search/providers/IBDBProvider.ts:
- Extends BaseSearchProvider with weight 4
- Call IBDB API: GET /api/search?q={query}
- Parse response (status: 'ok', books: ApiBook[])
- Normalize ApiBook to BookSearchResult format
- Map IBDB fields to our structure
- Handle network errors gracefully
```

### Prompt 7: Hardcover GraphQL Provider

```
Implement Hardcover book search using GraphQL.

Create src/lib/search/utils/hardcoverClient.ts:
- GraphQL client using fetch
- Endpoint: https://api.hardcover.app/v1/graphql
- Bearer token from process.env.HARDCOVER_TOKEN
- Handle GraphQL query structure

Create src/lib/search/providers/HardcoverProvider.ts:
- Extends BaseSearchProvider with weight 6
- GraphQL query based on: search(query: "...") { results }
- Explore response structure and map fields
- Normalize to BookSearchResult format
- Handle GraphQL errors and network failures
```

### Prompt 8: API Endpoint Integration

```
Update the existing search endpoint to use the new provider system.

Modify src/app/api/books/search/route.ts:
- Import SearchOrchestrator and all providers
- Create and configure orchestrator instance
- Register: LocalDatabaseProvider, GoogleBooksProvider, IBDBProvider, HardcoverProvider
- Replace searchBooks call with orchestrator.search
- Maintain exact response format: { books: BookSearchResult[] }
- Keep all existing auth and validation logic
- Ensure backwards compatibility
```

### Prompt 9: Integration Testing

```
Create a test file to validate the search system.

Create src/lib/search/__tests__/integration.test.ts:
- Test each provider individually with a known query
- Test orchestrator with all providers
- Test deduplication with books that exist in multiple sources
- Test timeout behavior (mock delayed responses)
- Test partial failure (one provider fails, others succeed)
- Verify response format matches expected structure
- Test with special characters in queries
```

---

## Success Validation Checklist

- [ ] All providers implement the same interface
- [ ] Local database search works with partial matching
- [ ] Google Books continues to work as before
- [ ] IBDB provider successfully queries the API
- [ ] Hardcover GraphQL queries return results
- [ ] Results are properly deduplicated by ISBN
- [ ] Fuzzy matching works for author variations
- [ ] Data augmentation fills missing fields
- [ ] Results are sorted by weight and limited
- [ ] 5-second timeout is enforced per provider
- [ ] Failed providers don't break the search
- [ ] API response format is unchanged
- [ ] No breaking changes for existing clients