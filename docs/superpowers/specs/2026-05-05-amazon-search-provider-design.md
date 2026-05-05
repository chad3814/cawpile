# Amazon Search Provider — Design

**Date:** 2026-05-05
**Branch:** `feat/amazon-search-provider`
**Status:** Approved (pending user review of written spec)

## Goal

Add Amazon as a *limited* book search provider, invoked exclusively through the
`asin:` tagged-search syntax. Use the [Rainforest API](https://rainforestapi.com/)
as the initial Amazon data source, behind a swappable client interface so a
later switch to PA-API, Keepa, or another provider does not ripple through
callers.

## Scope

In scope:

- New `asin:` tag in the existing tagged-search syntax.
- New tagged-search handler that fetches Amazon product data by ASIN.
- New `AmazonProductClient` interface with a `RainforestClient` implementation.
- DB-backed cache of Amazon responses keyed on ASIN, persisted forever (no TTL).
- New `AmazonBook` Prisma model, 1:1 with `Edition`, mirroring the existing
  `GoogleBook` / `HardcoverBook` / `IbdbBook` pattern.
- Persistence of `AmazonBook` records when a user adds an Amazon-sourced result
  to their library, via the existing `findOrCreateEdition` /
  `upsertProviderRecords` flow.
- Tests for the new tag parser entry, client (with cache wrapper), tagged-search
  handler, and persistence path.

Explicitly out of scope (deferred to future work):

- Free-text Amazon search. Amazon never registers with `SearchOrchestrator`.
- Amazon participating in `isbn:` parallel ISBN lookup.
- Cache TTL or automatic invalidation.
- Admin UI to browse or purge `AmazonAsinCache` (planned next task).
- Affiliate links or outbound URL building.
- UI surfacing of "from Amazon" badge on search results.
- Multi-region Amazon domains (`.co.uk`, `.de`, etc.). Hard-coded to `amazon.com`.
- Switching to a different Amazon data provider (interface allows it; not done
  in this scope).
- Backfilling existing local books whose ISBN-10 happens to equal an ASIN.

## Architecture

### Search request flow

`GET /api/books/search?q=asin:B0XXXXXXXX`:

1. `route.ts` calls `parseTaggedSearch()`.
2. `parseTaggedSearch()` recognizes the new `asin` tag and returns
   `{ tag: 'asin', value: 'B0XXXXXXXX' }`.
3. Route delegates to `handleTaggedSearch('asin', 'B0XXXXXXXX')`.
4. The handler's new `searchAmazonByAsin()` validates the ASIN shape and calls
   an `AmazonProductClient`.
5. The client first looks up `AmazonAsinCache` by ASIN. On hit, it returns the
   cached normalized payload. On miss, it calls Rainforest, persists the
   normalized payload to `AmazonAsinCache`, and returns.
6. The response is normalized to `BookSearchResult`, then wrapped as a
   `SignedBookSearchResult` with
   `sources: [{ provider: 'amazon', data: { ..., source: 'amazon', sourceWeight: 3 } }]`.
7. Returned to the client as a single-item `books` array (matching the existing
   tagged-search response shape).

Amazon does not participate in `SearchOrchestrator`. Free-text queries never
hit Rainforest.

### Book-add persistence flow

When a user adds an Amazon-sourced result to their library:

1. The existing `POST /api/user/books` flow runs through `findOrCreateBook` →
   `findOrCreateEdition`.
2. `findOrCreateEdition` matches existing editions via `isbn10` / `isbn13` from
   the signed result's data (these are populated from the Rainforest response,
   per the ASIN-handling decision below).
3. Inside `upsertProviderRecords` (in `src/lib/db/books.ts`), a new `amazon`
   branch upserts `AmazonBook` keyed on `editionId`, using the same pattern as
   the existing Hardcover and IBDB branches.

### Client interface boundary

The Amazon data source is abstracted behind `AmazonProductClient`.
`RainforestClient` is one implementation. Swapping to PA-API, Keepa, or any
other source means writing a new class implementing the same interface — no
callers change.

## Data Model

### New Prisma model: `AmazonBook`

1:1 with `Edition`, mirrors the existing provider tables:

```prisma
model AmazonBook {
  id            String   @id @default(cuid())
  asin          String   @unique
  editionId     String   @unique
  title         String
  authors       String[]
  description   String?
  publishedDate String?
  pageCount     Int?
  imageUrl      String?
  categories    String[]
  isbn10        String?
  isbn13        String?
  publisher     String?
  edition       Edition  @relation(fields: [editionId], references: [id], onDelete: Cascade)
  createdAt     DateTime @default(now())
}
```

Add the back-reference on `Edition`:

```prisma
amazonBook  AmazonBook?
```

### New Prisma model: `AmazonAsinCache`

Stores the normalized client response so we do not re-pay Rainforest:

```prisma
model AmazonAsinCache {
  asin      String   @id
  payload   Json
  fetchedAt DateTime @default(now())
}
```

Notes:

- `payload` is the normalized `AmazonProduct` shape (not the raw Rainforest
  blob), so the cache survives Rainforest schema changes.
- ASIN is the primary key — exactly one cache row per ASIN.
- No relation to `Edition`. The cache is independent: a `B0...` Kindle ASIN
  may never become an `Edition`.
- `fetchedAt` is recorded for diagnostics and for the future admin-purge UI;
  the cache layer itself never invalidates on its own.

### ASIN ↔ ISBN handling

Decision: trust Rainforest's response for ISBN data. When Rainforest returns
an `isbn` / `isbn_13` field on a product, those values populate
`Edition.isbn10` / `Edition.isbn13` at book-add time. The ASIN itself is never
inferred to be an ISBN-10 from string shape, even when it does not start with
`B0`.

Result: the `LocalDatabaseProvider` can locate the same `Edition` later via
ISBN, and the `Edition.isbn10` / `Edition.isbn13` columns remain authoritative
ISBN values.

### Migration

New Prisma migration `add_amazon_book_and_cache`. Both tables start empty —
no backfill.

### `getEdition` selection logic

`getEdition` (`src/lib/db/books.ts:303-327`) currently returns a union of
`googleBook | hardcoverBook | ibdbBook`. Extend it to also return
`amazonBook`. Add `amazonBook: true` to the `include` clause. Append `amazon`
to the metadata fallback chain so the priority becomes
`Edition > Hardcover > GoogleBooks > IBDB > Amazon`. Amazon is last because
its metadata is generally noisier than the curated book DBs.

## Client Interface

Lives in `src/lib/search/utils/amazonClient.ts`.

### Types

```ts
export interface AmazonProduct {
  asin: string;
  title: string;
  authors: string[];
  description?: string;
  publishedDate?: string;
  pageCount?: number;
  imageUrl?: string;
  categories: string[];
  isbn10?: string;
  isbn13?: string;
  publisher?: string;
}

export interface AmazonProductClient {
  getProductByAsin(asin: string): Promise<AmazonProduct | null>;
}
```

`null` is returned for not-found, invalid ASIN, missing API key, or any
upstream error. Errors are logged inside the implementation, matching the
existing `HardcoverClient` / `IbdbClient` pattern.

### `RainforestClient`

Implements `AmazonProductClient`.

- Reads `RAINFOREST_API_KEY` from `process.env`. If missing, logs an error and
  returns `null` without making a network call. Mirrors how `HardcoverClient`
  treats `HARDCOVER_TOKEN`.
- Calls `https://api.rainforestapi.com/request` with query parameters
  `type=product`, `amazon_domain=amazon.com`, `asin=<ASIN>`.
- 5-second timeout, matching the timeout used by other providers.
- Maps the Rainforest response to `AmazonProduct`. Field mapping (subject to
  re-verification against actual Rainforest responses during implementation):
  - `product.asin` → `asin`
  - `product.title` → `title`
  - `product.authors[].name` → `authors`
  - `product.description` → `description`
  - `product.publication_date` (or `product.first_available.raw`) → `publishedDate`
  - Page count from `product.book_description.pages` or the specifications
    array → `pageCount`
  - `product.main_image.link` → `imageUrl`
  - `product.categories[].name` → `categories`
  - `product.isbn` → `isbn10` (when 10 chars)
  - `product.isbn_13` → `isbn13`
  - `product.publisher` (or specifications array) → `publisher`

### `CachedAmazonClient`

Wraps any `AmazonProductClient` with `AmazonAsinCache` lookups.

- Constructor takes the inner client.
- `getProductByAsin(asin)`:
  1. `prisma.amazonAsinCache.findUnique({ where: { asin } })`.
  2. On hit, return `cache.payload as AmazonProduct`.
  3. On miss, call `inner.getProductByAsin(asin)`. If the inner returns `null`,
     return `null` and do not persist a cache row. Otherwise persist a new
     row via `prisma.amazonAsinCache.create` and return the payload.

The cache layer does the DB read and write; the underlying client is unaware
of the cache. This keeps test setup simple — tests can construct an uncached
`RainforestClient` for integration coverage, or stub the inner client and
verify cache behavior in isolation.

Construction at the call site: `new CachedAmazonClient(new RainforestClient())`.

## Tagged Search Wiring

Two files change.

### `src/lib/search/utils/tagParser.ts`

- `TagType` adds `'asin'`:
  `'ibdb' | 'hard' | 'gbid' | 'isbn' | 'asin'`.
- Regex updates to `/^(ibdb|hard|gbid|isbn|asin):(.+)$/i`.
- The parser does not validate ASIN shape — that is the handler's job, so
  shape errors return a meaningful response instead of falling through to
  free-text search.

### `src/lib/search/handlers/taggedSearchHandler.ts`

- `PROVIDER_NAMES` adds `amazon: 'Amazon'`.
- New helper `amazonProductToSearchResult(product: AmazonProduct):
  BookSearchResult`, parallel to `ibdbBookToSearchResult` and
  `hardcoverDocToSearchResult`. Maps `AmazonProduct` to the search result
  shape, copying `asin` and `publisher` through to the new optional fields
  on `SearchProviderResult` (see "Type extension" below).
- New function `searchAmazonByAsin(asin: string):
  Promise<TaggedSearchResponse>`:
  1. Validate ASIN shape: 10 alphanumeric characters, uppercased. Reject
     otherwise with `error: \`Invalid ASIN: ${rawAsin}. ASIN must be 10
     alphanumeric characters.\``.
  2. Construct `new CachedAmazonClient(new RainforestClient())`.
  3. Call `client.getProductByAsin(asin)`.
  4. If `null`, return the standard not-found shape with
     `provider: 'amazon'`.
  5. Otherwise, normalize via `amazonProductToSearchResult()`, wrap with
     `wrapAsSignedResult(result, 'amazon', 3)`, return.
- New `case 'asin':` branch in `handleTaggedSearch`'s switch, calling
  `searchAmazonByAsin`.

### Source weight

Use **3** for Amazon, one less than IBDB's 4. The weight only affects
merging when multiple providers contribute data for the same book. Since
`asin:` returns only the Amazon source on its own, this is largely cosmetic
today — included for consistency with the existing weighting scheme.

### `searchByIsbn` is unchanged

The existing parallel-ISBN-fanout `searchByIsbn` does not gain an Amazon leg.
Adding Rainforest to that fanout would mean paying for every ISBN search even
when other providers already have the data, which contradicts the "limited"
framing of this work.

## Persistence on Book-Add

Three touch points in `src/lib/db/books.ts`.

### Type extension: `SearchProviderResult`

Extend `SearchProviderResult` (in `src/lib/search/types.ts`) with two
optional fields:

```ts
asin?: string;
publisher?: string;
```

Other providers leave them undefined. This lets the Amazon-sourced data flow
through the existing signed-result pipeline cleanly, without requiring a
secondary cache lookup at upsert time.

### New mapper `mapAmazonSource`

Parallel to `mapHardcoverSource` and `mapIbdbSource`:

```ts
function mapAmazonSource(
  source: SourceEntry,
  editionId: string
): Prisma.AmazonBookCreateInput {
  const data = source.data;
  return {
    asin: data.asin || '',
    edition: { connect: { id: editionId } },
    title: data.title || 'Unknown Title',
    authors: data.authors || [],
    description: data.description || null,
    publishedDate: data.publishedDate || null,
    pageCount: data.pageCount || null,
    imageUrl: data.imageUrl || null,
    categories: data.categories || [],
    isbn10: data.isbn10 || null,
    isbn13: data.isbn13 || null,
    publisher: data.publisher || null,
  };
}
```

If `data.asin` is missing for some reason (defensive), the upsert will fail
the `asin @unique` constraint or write an empty string. The upsert is wrapped
in a `try / catch` like the other branches, so a failure logs and continues.

### New `amazon` branch in `upsertProviderRecords`

Mirrors the existing Hardcover and IBDB branches:

- `prisma.amazonBook.findUnique({ where: { editionId } })`.
- If found, `update` with the normalized fields.
- If not found, `create` from `mapAmazonSource(source, editionId)`.
- `try / catch` wrapping with `console.error('Failed to upsert AmazonBook:',
  error)`.

The function's return shape grows a fourth key:
`amazon: 'created' | 'updated' | 'unchanged' | null`. Callers use the value
informationally (no specific-key inspection observed during exploration);
this will be re-verified during implementation.

### `getEdition` extension

- Add `amazonBook: AmazonBook | null` to the function's return type.
- Add `amazonBook: true` to the `include` clause.
- Append `amazonBook` to the metadata fallback chain
  (`Edition > Hardcover > GoogleBooks > IBDB > Amazon`).

### ISBN / Edition reconciliation

`findOrCreateEdition` already matches editions by `isbn10` / `isbn13`. Since
those values are populated from the Rainforest response (see "ASIN ↔ ISBN
handling" above), an existing Edition with the same ISBN gets reused;
otherwise a new Edition is created. No change to the matching logic itself
is needed beyond the new sources branch.

## Configuration

- `RAINFOREST_API_KEY` — required for Amazon lookups.
  - Documented in `.env.example` with a one-line comment describing its role.
  - Missing key is treated as a clean failure: `RainforestClient` logs and
    returns `null`. The tagged-search handler returns the standard
    not-found response. No 5xx is raised.
- No changes to `src/lib/auth.ts` or other configuration files.

## Tests

All new tests follow the existing patterns in `__tests__/lib/search/`: Jest,
the `prisma` singleton from `jest.setup.ts`, and `fetch` mocked via
`global.fetch = jest.fn()`.

### `tagParser.test.ts` (extend)

- `asin:B0XXXXXXXX` → parsed as `{ tag: 'asin', value: 'B0XXXXXXXX' }`.
- Case insensitivity: `ASIN:0451524934` parses correctly.
- Verify the existing tags still parse unchanged.

### `amazonClient.test.ts` (new)

- `RainforestClient` with `fetch` mocked:
  - Happy path: returns a fully populated `AmazonProduct`.
  - `RAINFOREST_API_KEY` missing: returns `null`, no `fetch` call.
  - HTTP error: returns `null`, error logged.
  - Malformed response: returns `null`, error logged.
  - Timeout: returns `null` after 5 seconds.
- `CachedAmazonClient` with the inner client mocked:
  - Cache hit returns the cached payload without calling the inner client.
  - Cache miss calls the inner, persists a row, returns the payload.
  - Inner returning `null` does not persist a row.

### `taggedSearchHandler` tests (extend or new file)

The repo currently uses both `tagParser.test.ts` and
`taggedSearchEdgeCases.test.ts` for tag-related coverage. New cases land in a
new sibling file or extend the edge-cases file (decided during
implementation):

- Valid 10-char ASIN with `B0` prefix returns a wrapped
  `SignedBookSearchResult` with `provider: 'amazon'`.
- Valid ISBN-10-shaped ASIN (e.g. `0451524934`) returns a wrapped result.
- Invalid ASIN (wrong length, special chars) returns the error response.
- `CachedAmazonClient` returning `null` produces a not-found error response.

### `books.test.ts` (extend or new)

- `upsertProviderRecords` creates an `AmazonBook` from an Amazon source.
- `upsertProviderRecords` updates an existing `AmazonBook` in place.
- `getEdition` includes `amazonBook` in its return value.
- The metadata fallback chain reaches Amazon last when other provider records
  are absent.

## Open implementation notes

- The exact Rainforest response field paths (`publication_date` vs
  `first_available`, page count location, isbn vs isbn_10 naming, etc.)
  will be verified against an actual API response during implementation. The
  mapping in this spec is a working hypothesis based on Rainforest's
  documented schema.
- `searchByIsbn` deliberately does not include Amazon; if that decision is
  revisited later, the change is adding one more `Promise.allSettled` leg
  using the same `CachedAmazonClient`.
