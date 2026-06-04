# Books Section Pages — Rich List Rows

**Date:** 2026-06-03
**Branch:** `feat/books-display-format`
**Status:** Approved

## Problem

The `/books/[section]` subpages (`newest`, `popular`, `top-rated`) render books as a
responsive grid of small cover cards (`PublicBookCard`). The cards show only a cover,
title, author, and a single stat — not enough to browse meaningfully. We want these
subpages to use a richer, horizontal list row modeled on the individual book page's
hero: large cover, title, author, star rating with `(x/10)` and rating count, and a
truncated description.

## Scope

- **In scope:** Replace the card grid with rich list rows on the three section pages
  (`/books/newest`, `/books/popular`, `/books/top-rated`) and their infinite-scroll
  load-more path. Extend the ranking data layer with the fields the row needs.
- **Out of scope:** The `/books` landing page and `PublicBookCard` (the landing keeps
  its cover-card grid). The individual book page (`/b/[id]`). Ranking/sort logic.

## Background (current state)

- `src/app/books/[section]/page.tsx` fetches a section's first page via the ranking
  fetchers and renders `BooksSectionClient`.
- `BooksSectionClient` (`src/components/books/BooksSectionClient.tsx`) renders a
  6-col card grid of `PublicBookCard` and loads more via
  `GET /api/books?section=&offset=&limit=`, deduping by `id` and handling retry.
- `src/app/api/books/route.ts` returns `{ books: RankedBook[], hasMore }`.
- `RankedBook` (`src/lib/db/bookRankings.ts`) = `{ id, title, authors, coverUrl, stat }`,
  where `stat` is one of `addedAt` (ISO string) | `readers` | `rating`. `BASE_SELECT`
  fetches `id, title, authors, createdAt, readerCount, bayesianRating, editions(cover)`.
  It does **not** fetch a description or a rating count.
- The book-page hero rating is the aggregated `CawpileRating.average`. On `Book`,
  `ratingSum`/`ratingCount` are the running sum/count of `cawpileRating.average`
  (set by `recomputeBookStats`), so `ratingSum / ratingCount` equals that hero average.
- The hero description comes from `edition.googleBook?.description ||
  hardcoverBook?.description || ibdbBook?.description`, rendered through
  `sanitizeHtml` (`src/lib/utils/sanitize.ts`).
- `StarRating` (`src/components/rating/StarRating.tsx`) takes a 0–10 `rating`
  (`number | null`), renders gold stars, and shows "Not rated" for `null`/`0`.

## Design

### New component — `src/components/books/BookListRow.tsx`

A single horizontal row, the whole row a `<Link href={`/b/${id}`}>`:

- **Cover** (left, ~96×144) using the same Google/placeholder fallback pattern as
  `PublicBookCard` (reuse the existing placeholder SVG).
- **Title** (prominent), **author(s)** (`authors.join(', ')`).
- **Rating block:** `<StarRating rating={averageRating} />` + `(x/10)` text +
  "Based on N ratings". When `ratingCount === 0` (i.e. `averageRating === null`),
  `StarRating` renders "Not rated" and the "Based on N ratings" line is omitted.
- **Section stat line:** the section's contextual stat — `Added {Mon YYYY}` for
  `addedAt`, `{n} readers` for `readers`. For `rating` (Top-Rated) the stat *is* the
  rating already shown above, so no separate stat line is rendered.
- **Description:** sanitized via `sanitizeHtml` and clamped to 3 lines
  (`line-clamp-3`). Omitted entirely when there is no description.

Renders the `formatStat` logic currently in `PublicBookCard` for the `addedAt`/
`readers` cases; extract the shared formatter to avoid duplication (see below).

### Data layer — `src/lib/db/bookRankings.ts`

Add an **opt-in detail mode** so only the section pages pay for the extra data:

- New type `RankedBookDetail = RankedBook & { averageRating: number | null;
  ratingCount: number; description: string | null }`.
- `averageRating = ratingCount > 0 ? Math.round((ratingSum / ratingCount) * 10) / 10 : null`.
- `description`: first non-empty of the cover edition's
  `googleBook.description / hardcoverBook.description / ibdbBook.description`.
- The three fetchers (`getNewestBooks`, `getPopularBooks`, `getTopRatedBooks`) gain a
  `detail` parameter (default `false`). When `true`, the Prisma select additionally
  pulls `ratingSum`, `ratingCount`, and the edition description fields, and the mapper
  returns `RankedBookDetail`. Typed via overloads so `detail: true` returns
  `RankedBookDetail[]` and the default returns `RankedBook[]`.
- The `/books` landing (`src/app/books/page.tsx`) keeps calling the fetchers **without**
  `detail`, so its cached payload stays lean.

### Wiring

- `src/app/books/[section]/page.tsx`: call the fetcher with `detail: true`; pass
  `RankedBookDetail[]` to `BooksSectionClient`.
- `src/app/api/books/route.ts`: call the fetcher with `detail: true`; response shape
  becomes `{ books: RankedBookDetail[], hasMore }`.
- `BooksSectionClient`: prop/state typed `RankedBookDetail[]`; replace the
  `grid grid-cols-2 … lg:grid-cols-6` container with a single-column vertical list of
  `BookListRow`. Infinite scroll, dedup-by-id, retry, and "No more books" are unchanged.

### Shared formatter

Extract the `addedAt`/`readers` stat formatting (currently inline in `PublicBookCard`)
into a small shared helper (e.g. `formatBookStat` in `bookRankings.ts` or a sibling
util) so `PublicBookCard` and `BookListRow` format identically. `PublicBookCard` is
otherwise unchanged.

## Edge cases

- **Unrated books** (common in Newest/Popular): `averageRating === null` →
  `StarRating` shows "Not rated", count line omitted. Description still shows if present.
- **No description**: description block omitted; row still renders cleanly.
- **Top-Rated stat redundancy**: no separate stat line (rating block covers it).
- **Long titles/descriptions**: title wraps; description clamps to 3 lines with overflow
  hidden.

## Testing

- **`BookListRow`** (`__tests__/components/books/BookListRow.test.tsx`): renders title,
  author, and a `/b/[id]` link; shows stars + `(x/10)` + "Based on N ratings" for a
  rated book; renders "Not rated" and omits the count line for an unrated book; renders
  a sanitized, present description and omits the block when absent; shows the per-section
  stat for `addedAt`/`readers` and none for `rating`.
- **`bookRankings` detail mode** (extend existing lib test): `detail: true` returns
  `averageRating` = `round(ratingSum/ratingCount, 1)` (and `null` when `ratingCount` is
  0) and a `description` picked from the edition providers; default mode is unchanged.
- **`BooksSectionClient`**: if the existing test asserts the grid/card layout, update it
  to assert the list of rows; keep coverage of load-more dedup/retry.

## Verification

Before any commit: `npm run lint`, `npm run type-check`, `npm run test`, and
`npm run build` must all pass (root + `services/video-gen` cascade). No commit or push
without explicit approval.
