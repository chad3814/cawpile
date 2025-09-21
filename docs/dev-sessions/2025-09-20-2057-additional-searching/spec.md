# Dev Session Spec: Additional Search Providers

## Session Arguments
"additional-search" add additional search providers

## Objective
Extend the existing book search functionality to query multiple sources simultaneously, providing users with comprehensive search results from local database, Google Books, IBDB, and Hardcover, with an extensible architecture for future providers.

## Requirements

### Search Sources
1. **Local Database** (always primary)
   - Search Books and Editions tables
   - Search fields: title and authors only
   - Partial matching support
   - No user-specific data included

2. **Google Books** (weight: 5)
   - Existing implementation
   - Continue using current API integration

3. **IBDB** (weight: 4)
   - Base URL: https://ibdb.dev
   - Endpoint: `/api/search?q={query}`
   - No authentication required

4. **Hardcover** (weight: 6)
   - GraphQL endpoint: https://api.hardcover.app/v1/graphql
   - Bearer token authentication (stored in env)
   - Explore query structure based on search query example

### Architecture

#### Provider Interface
Each search provider implements:
- `search(query: string, limit: number): Promise<BookSearchResult[]>`
- `name: string` - provider identifier
- `weight: number` - priority for result merging
- `timeout: number` - default 5000ms

#### Provider Responsibilities
- Handle own API authentication/keys
- Normalize responses to BookSearchResult format
- Handle own error conditions

#### Registration
- Manual registration in code (for now)
- Future: could move to configuration-based

### Search Behavior

#### Execution
- Search all sources in parallel
- 5-second timeout per source
- Silent failure handling (failed sources don't break search)
- Return merged results after all complete or timeout

#### Result Processing
1. **Deduplication**
   - ISBN match (immediate and definitive)
   - Fallback: title + fuzzy author matching

2. **Data Priority**
   - Local database always primary
   - Augment local with missing data from external
   - External priority by weight: Hardcover (6) > Google (5) > IBDB (4)

3. **Result Limits**
   - Request same limit from each source
   - After merge/dedup, sort by source weight
   - Return only top X results as requested

### API Endpoint
- Update existing `/api/books/search` endpoint
- Maintain current response format
- No versioning needed
- Handle empty results same as current implementation

### Data Fields
Use existing BookSearchResult interface:
- id, googleId, title, subtitle
- authors[], description
- publishedDate, pageCount
- categories[], imageUrl
- isbn10, isbn13

## Success Criteria
1. **Functional Requirements**
   - Searches return unified results from all 4 sources
   - Results properly deduplicated by ISBN/title+author
   - Local results prioritized with data augmentation
   - 5-second timeout enforced per source
   - Failed sources don't break overall search

2. **Performance**
   - All searches complete within 5 seconds max
   - Parallel execution reduces total search time

3. **Extensibility**
   - New providers can be added by implementing interface
   - Provider weight system allows easy priority adjustment
   - Clean separation of provider logic

4. **Compatibility**
   - Existing API endpoint continues to work
   - Response format unchanged
   - No breaking changes for current clients

## Implementation Notes
- No special query preprocessing
- No rate limiting implementation (for now)
- Pass queries as-is to each provider
- No user notification of failed sources
