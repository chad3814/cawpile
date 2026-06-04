# Public "Track book" button — design

**Date:** 2026-06-04
**Branch:** `feat/public-track-book-button`

## Goal

Add a "Track book" button to the public book page (`/b/[bookId]`, e.g.
`https://cawpile.org/b/cmpzd8bic0004ju042p7eba6h`) so a visitor can add the book to
their own library directly from the public page.

## Background

- The public book page is server-rendered and currently has **no session/auth
  awareness**. It renders from `getBookPageData(bookId)` and is cached with
  `revalidate = 60` (ISR).
- "Tracking" a book means creating a `UserBook` record (status
  `WANT_TO_READ | READING | COMPLETED | DNF`, plus format, dates, acquisition,
  book club / readathon, reread flag).
- The existing add flow — `AddBookWizard` → `POST /api/user/books` — requires an
  **HMAC-signed search result** (`SignedBookSearchResult`). That signature exists to
  stop tampering with *untrusted external search data* before it is persisted.
- On the public page the `Book` + `Edition` **already exist in the DB**, so we hold a
  trusted internal `editionId` and have no signed result. This is the central problem
  the design solves.

## Decisions (from brainstorming)

1. Clicking "Track book" (logged in) opens the **full `AddBookWizard`** — same
   multi-step experience as the dashboard add flow.
2. For a **logged-out** visitor the button is visible; clicking redirects to sign-in
   and returns the visitor to this book page afterward.
3. If the user **already has the book**, the button stays active; the duplicate is
   handled by the wizard/API (which returns "already in library").

## Approach (chosen: A)

Add an `editionId` branch to `POST /api/user/books`. An internal edition id needs no
signing, so when the body carries `editionId` instead of `signedResult` we skip
signature verification and find-or-create, look up the existing edition, and run the
**identical** `UserBook`-creation + stats logic.

Rejected alternatives:
- **B — mint a fake `SignedBookSearchResult` from the edition.** Lossy/fragile
  reconstruction of the full search-result shape, re-runs find-or-create to re-find
  what we already have, and abuses the signing mechanism for trusted data.
- **C — a separate `POST /api/user/books/track` endpoint.** Clean separation but
  forces extracting/duplicating the tracking-field + stats logic.

## Changes

### 1. API — `POST /api/user/books`

Accept **either** `editionId` **or** `signedResult` in the request body.

- `editionId` path:
  - 401 if not authenticated (unchanged guard).
  - Look up the edition by id; **404** if it does not exist.
  - Reuse the existing duplicate check → **400 "Book already in library"**.
  - Reuse the existing book-club / readathon autocomplete upserts.
  - Reuse the existing `UserBook` create + `recomputeBookStats` transaction.
- `signedResult` path: unchanged (signature verification + find-or-create).
- Validation: exactly one of `editionId` / `signedResult` must be present; format
  array validation applies to both paths.

No new endpoint; no tracking/stats logic duplicated.

### 2. `AddBookWizard`

Add an optional **edition mode**:
- New optional props: a display object (`title`, `authors`, `imageUrl`) and
  `editionId`.
- When in edition mode the submit body posts `editionId`; otherwise it posts
  `signedResult` as today.
- Display (cover/title/authors) reads from the display object in edition mode and from
  `book` otherwise.
- **Surface the API error** to the user (e.g. "Already in your library") instead of
  silently swallowing it — required because duplicates are handled in the wizard.

The existing search-driven callers are unaffected (props are additive/optional).

### 3. New `TrackBookButton` client component

Rendered inside `BookPageClient` (already a client component). Uses `useSession()`.

- **Logged out:** `router.push('/auth/signin?callbackUrl=' +
  encodeURIComponent('/b/<bookId>?track=1'))`.
- **Logged in:** opens `AddBookWizard` in edition mode for this edition.
- **Return from sign-in:** when the page loads with `?track=1` and the user is
  authenticated, auto-open the wizard, then strip the `track` param from the URL.
- Always active; duplicate handling is delegated to the wizard/API.
- On success, show a brief "Added to your library" confirmation.

Display data passed from `BookPageClient`: `book.title`, `book.authors`, `edition.id`,
and `getCoverImageUrl(edition)`.

### 4. Caching

The page stays `revalidate = 60` (ISR). The button resolves auth client-side via
`useSession`, so the cached HTML is unaffected and the page need not become dynamic.

## Testing

New feature requires unit tests (project rule). Plan:

- **API `editionId` branch:** add by editionId (happy path), duplicate → 400, invalid
  / missing edition → 404, unauthenticated → 401.
- **`TrackBookButton`:** logged-out click redirects to sign-in with the correct
  `callbackUrl`; logged-in click opens the wizard; `?track=1` + authenticated
  auto-opens the wizard.
- **`AddBookWizard` edition mode:** submit posts `editionId` (not `signedResult`); API
  error message is surfaced.

## Out of scope (YAGNI)

- One-click / status-picker quick-add variants.
- Pre-fetching the user's library to show an "In your library" state on load.
- Any change to the search-driven add flow beyond additive wizard props and error
  surfacing.
