# Books Discovery Page — Design

**Date:** 2026-06-02
**Branch:** `feat/books-discovery`
**Status:** Approved design, pending implementation plan

## Goal

Add a public, indexable books discovery surface at `/books`, mirroring the
dashboard's section + drill-down structure. The landing page shows three preview
sections; each drills into its own page with infinite scroll.

Sections:
1. **Newest** — books most recently added to the platform (`Book.createdAt`).
2. **Popular** — books tracked by the most distinct users, regardless of reading
   status.
3. **Top Rated** — books with the highest Bayesian-weighted CAWPILE rating,
   excluding books with zero completed ratings.

## Audience & SEO

- **Public and indexable** — no authentication required, behaves like the
  existing `/b/[bookId]` detail pages (which are `index, follow`).
- Cards link to `/b/[bookId]`.
- The landing page and each drill-down page render their first results
  server-side for crawlability, then the drill-down hydrates into client-side
  infinite scroll.

## Architecture Overview

The core challenge is that the three rankings require aggregating across
`Book → Edition → UserBook (→ CawpileRating)`, and Prisma's typed `groupBy`
cannot group by `bookId` (it is a scalar of `Edition`, not `UserBook`) nor do a
`COUNT(DISTINCT userId)`.

**Decision: denormalize aggregate columns onto `Book`, maintained by a single
recompute function, with a singleton global-stats row supplying the Bayesian
global mean and tunable weight.** Reads then become simple indexed `orderBy`
queries with no raw SQL anywhere.

### Why recompute instead of incremental deltas

Per-book counters are **recomputed from source** (not adjusted by `+1/-1`) inside
the caller's transaction. This makes per-book counters impossible to drift,
because they are always derived from truth. The recompute is fully typed Prisma
scoped to a single book, so it is cheap.

The **global** ratings totals are maintained by atomic delta (`increment`) for
efficiency, with a re-runnable backfill script as the source-of-truth repair
path.

## Data Model Changes

### `Book` — new denormalized columns

```prisma
model Book {
  // ... existing fields ...
  readerCount    Int   @default(0)  // distinct users tracking, any status
  ratingCount    Int   @default(0)  // COMPLETED + rated UserBooks
  ratingSum      Float @default(0)  // sum of CawpileRating.average over those
  bayesianRating Float @default(0)  // (C*m + ratingSum) / (C + ratingCount)

  @@index([createdAt])      // newest
  @@index([readerCount])    // popular
  @@index([bayesianRating]) // top-rated
  // existing @@unique([title, authors]) and @@index([title]) retained
}
```

### New singleton model — `GlobalBookStats`

```prisma
model GlobalBookStats {
  id           String   @id @default("global") // single-row enforced by fixed id
  weightC      Float    @default(10)           // Bayesian weight, runtime-tunable
  ratingsCount Int      @default(0)            // global COMPLETED-rated count
  ratingsTotal Float    @default(0)            // global sum of CawpileRating.average
  updatedAt    DateTime @updatedAt
}
```

- Global mean `m = ratingsTotal / ratingsCount`.
- When `ratingsCount == 0`, fall back to a neutral mean (`NEUTRAL_MEAN = 5.5`,
  the midpoint of the 1–10 scale) so the formula is well-defined.
- `weightC` defaults to `10` and is editable at the row level without a deploy.

### Migration

A Prisma migration adds the four `Book` columns + three indexes and creates
`GlobalBookStats` with its single seeded `global` row.

## Core Module: `src/lib/db/bookStats.ts`

```ts
const NEUTRAL_MEAN = 5.5;

/** Recompute a single book's denormalized stats from source, inside a tx. */
async function recomputeBookStats(
  bookId: string,
  tx: Prisma.TransactionClient,
): Promise<void>;
```

Behavior:
1. Read the book's *current* `ratingCount` / `ratingSum` (old values).
2. Recompute from source (typed Prisma, scoped to this book):
   - `readerCount` = `tx.userBook.findMany({ where: { edition: { bookId } }, select: { userId: true }, distinct: ['userId'] })`.length
   - `{ _count, _sum: { average } }` = `tx.cawpileRating.aggregate({ where: { userBook: { status: 'COMPLETED', edition: { bookId } } } })`
   - `newCount = _count`, `newSum = _sum.average ?? 0`
3. Atomically apply the delta to the global row and read it back authoritatively
   (same transaction):
   ```ts
   const global = await tx.globalBookStats.upsert({
     where: { id: 'global' },
     create: { id: 'global', ratingsCount: newCount, ratingsTotal: newSum },
     update: {
       ratingsCount: { increment: newCount - oldCount },
       ratingsTotal: { increment: newSum - oldSum },
     },
   });
   ```
4. Compute `m = global.ratingsCount > 0 ? global.ratingsTotal / global.ratingsCount : NEUTRAL_MEAN`
   and `bayesianRating = (global.weightC * m + newSum) / (global.weightC + newCount)`.
5. Persist the book's new `readerCount`, `ratingCount`, `ratingSum`,
   `bayesianRating`.

> Note: the write path uses the **transaction-returned** global row for the
> bayesian computation, never the in-memory cache, so a stale cache can never
> corrupt a stored value.

### Read-side cache: `getGlobalBookStats()`

A module-level cached accessor (short TTL + invalidate-on-write) returning
`{ weightC, ratingsCount, ratingsTotal, mean }` for read consumers that want
`m`/`C` without a DB hit (e.g. a future admin config view or a global-stats
display). Not used by the write path.

## Write-Path Integration (5 call sites, 3 files)

Each mutation is wrapped in `prisma.$transaction` together with
`recomputeBookStats(bookId, tx)`:

| # | Location | Operation | bookId source |
|---|----------|-----------|---------------|
| 1 | `POST /api/user/books` (`route.ts:157`) | `userBook.create` | `edition.bookId` |
| 2 | `PATCH /api/user/books/[id]` (`[id]/route.ts:222`) | `userBook.update` (status may change) | from fetched userBook → `edition.bookId` |
| 3 | `PATCH /api/user/books/[id]` (`[id]/route.ts:256/262`) | `cawpileRating.create`/`update` | same |
| 4 | `DELETE /api/user/books/[id]` (`[id]/route.ts:331`) | `userBook.delete` | fetch `edition.bookId` before delete |
| 5 | `POST /api/reading-sessions` (`route.ts:76/87`) | `userBook.update` (auto-completes at 100%) | `userBook.edition.bookId` |

`DELETE /api/admin/books/[id]` deletes the whole book (cascade) — no recompute
needed; the counters disappear with the row. No code path ever changes
`edition.bookId`, so editions never move between books (verified — no
merge/reassign feature exists).

For #2 and #3 (same request can update status *and* rating), recompute runs once
after both mutations within the one transaction.

## Backfill / Repair Script: `scripts/recompute-book-stats.ts`

Re-runnable. Recomputes from scratch:
1. Global row: `ratingsCount` / `ratingsTotal` via aggregate over all
   `CawpileRating` whose `userBook.status === 'COMPLETED'`.
2. Every `Book`'s `readerCount`, `ratingCount`, `ratingSum`, `bayesianRating`.

Used for the initial backfill after migration and as the source-of-truth repair
for any global-delta drift. Added as an npm script (e.g. `npm run recompute-book-stats`).

## Read Queries: `src/lib/db/bookRankings.ts`

A shared `RankedBook` shape (book id, title, authors, cover URL, and the
section-relevant stat) plus three functions, all simple indexed Prisma queries
with `take`/`skip` (offset pagination, matching the existing
`/api/user/templates` convention):

```ts
type RankedBook = {
  id: string;
  title: string;
  authors: string[];
  coverUrl: string | null;
  stat: { kind: 'addedAt'; value: Date }
      | { kind: 'readers'; value: number }
      | { kind: 'rating'; value: number };
};

getNewestBooks(limit, offset): orderBy { createdAt: 'desc' }, then id for tie-break
getPopularBooks(limit, offset): orderBy [{ readerCount: 'desc' }, { id: 'asc' }]
getTopRatedBooks(limit, offset): where { ratingCount: { gt: 0 } },
                                 orderBy [{ bayesianRating: 'desc' }, { id: 'asc' }]
```

Cover URL resolved from the book's first edition via the existing
`getCoverImageUrl` helper. Books with no edition are skipped (consistent with
`getBookPageData`, which returns null when there are no editions).

## Routes & Components

### `src/app/books/page.tsx` (Server Component)
- `export const revalidate = 300` (ISR, same style as `/b/[bookId]`).
- `index, follow` metadata.
- Fetches the first ~12 of each section in parallel and renders three
  `BookSection` blocks.

### `src/app/books/[section]/page.tsx` (Server Component)
- `SECTION_MAP` validates slug (`newest` | `popular` | `top-rated`), else
  `notFound()`.
- `export const revalidate = 300`.
- Per-section `generateMetadata` (`index, follow`).
- Renders first page (~24) server-side, passes to `BooksSectionClient`.

### `src/app/api/books/route.ts` (GET)
- `?section=newest|popular|top-rated&offset=<n>&limit=24`.
- Public (no auth). Returns `{ books: RankedBook[], hasMore: boolean }`.
- Validates `section`, clamps `limit`.

### Components (`src/components/books/`)
- `PublicBookCard.tsx` — cover + title + author(s) + section stat badge; links to
  `/b/[bookId]`. Stat badge renders per `stat.kind`: "Added {Mon YYYY}",
  "{n} readers", "{x.x} avg".
- `BookSection.tsx` — section heading + preview grid + "View all →" link to
  `/books/[section]`.
- `BooksSectionClient.tsx` — `"use client"`; receives SSR first page, appends via
  `GET /api/books` using an `IntersectionObserver` sentinel; tracks `offset`,
  `hasMore`, `loading`; shows a loading row and an end-of-list state.

### Navigation
- Add a "Browse" link to `src/components/layout/Header.tsx` pointing to `/books`
  (visible to all users, authed or not).

## Error Handling

- Invalid `section` slug → `notFound()` (page) / 400 (API).
- API failures → JSON error + appropriate status; client shows a retry affordance
  and stops the infinite-scroll loop.
- Books missing an edition/cover → cover falls back to a placeholder; books with
  no edition are excluded from rankings.
- Recompute runs inside the mutation transaction; if recompute throws, the whole
  mutation rolls back (counters and the user action stay consistent).

## Testing

- **`recomputeBookStats`** (unit/integration): distinct-user count across
  multiple editions; COMPLETED-only rating aggregation; Bayesian math with a
  known `C`/`m`; global delta correctness across create/update/delete/status
  flips.
- **Write paths** (integration): each of the 5 call sites updates the book's
  counters and the global row correctly, and rolls back on failure.
- **Backfill script**: produces values identical to incremental maintenance on a
  seeded dataset.
- **`bookRankings`**: ordering, tie-breaking, `ratingCount > 0` filter for
  top-rated, pagination offsets.
- **`GET /api/books`**: section validation, pagination, `hasMore`.
- **`PublicBookCard`**: renders each stat-badge variant; links to `/b/[bookId]`.

## Tradeoffs (acknowledged)

- **Global-mean staleness:** a write to book A does not refresh book B's stored
  `bayesianRating`, since `m` shifts slightly as the library grows. The drift is
  negligible for a browse ranking and the backfill script corrects it. The
  alternative (computing `m` live in a raw-SQL `ORDER BY`) was rejected to keep
  reads typed and raw-SQL-free.
- **Singleton write hotspot:** every rating-affecting write touches the one
  `GlobalBookStats` row. Atomic `increment` keeps it correct without explicit
  locks; contention is negligible at a book tracker's write volume.
- **Offset pagination** can theoretically skip/repeat an item if rankings shift
  mid-scroll. Acceptable for a browse surface and consistent with existing code;
  cursor pagination is a future option if needed.

## Out of Scope (YAGNI)

- Cron-based materialized snapshots.
- Cursor pagination.
- Search/filtering within the books page (separate feature).
- Admin UI for editing `weightC` (the column is editable directly for now).
