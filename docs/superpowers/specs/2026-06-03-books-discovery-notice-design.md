# Feature Notice: Announce the `/books` Discovery Page

**Date:** 2026-06-03
**Branch:** `feat/books-discovery-notice`

## Goal

Announce the existing `/books` discovery page (Newest / Most Popular / Top
Rated browse sections) to users via a one-time feature notice modal.

## Background

Cawpile already has a Feature Notices system (see `docs/feature-notices.md`):
notices are modal alerts shown once per user on page load, with dismissal
persisted in the `SeenNotice` table. The `/books` landing page and its
`/books/[section]` pages already exist. This work only adds a new notice using
the established pattern — no changes to the notice infrastructure.

## Scope

Add a single feature notice. No changes to the modal wrapper, container, API
routes, types, or targeting infrastructure.

### New file — `src/components/notices/BooksDiscoveryNotice.tsx`

A client component mirroring `SettingsNotice`:

- Body copy announcing the Browse Books page and its three sections.
- An animated webp via `next/image` (`unoptimized`), placed above the action
  buttons with `rounded-lg border` styling — same treatment as
  `SettingsNotice`.
  - `src="/images/books-discovery-notice.webp"`
  - `width={512} height={584}` (matching `SettingsNotice`; revisit if the
    final asset differs)
  - The asset itself (`public/images/books-discovery-notice.webp`) is produced
    separately by the user and is not part of this implementation.
- Primary **"Explore Books"** link → `/books`, calling `onDismiss` on click so
  the modal closes after navigation.
- Secondary **"Got it"** button → `onDismiss`.

### Registration (per the documented two-registry pattern)

- `src/lib/notice-components.ts` — add
  `'books-discovery-2026-06': BooksDiscoveryNotice`.
- `src/lib/notices.ts` — add the `Notice` object:
  - `id: 'books-discovery-2026-06'`
  - `title: 'Discover Books'`
  - `component: BooksDiscoveryNotice`
  - `target: async () => true` (all logged-in users)

### Notice ID

`books-discovery-2026-06` — permanent, follows the `kebab-description-YYYY-MM`
convention. Never reuse or rename.

## Copy

- **Modal title:** Discover Books
- **Body:** "You can now browse books across all of Cawpile — explore the
  **Newest** arrivals, **Most Popular** titles, and **Top Rated** reads from
  the whole community."
- **Buttons:** `[ Got it ]  [ Explore Books → ]`

## Testing

Unit test for `BooksDiscoveryNotice` (mirroring existing notice-component test
conventions, with `next/image` mocked):

- Renders the announcement copy.
- The "Explore Books" link's `href` is `/books`.
- Clicking "Got it" invokes `onDismiss`.
- Clicking "Explore Books" invokes `onDismiss`.

## Out of Scope (YAGNI)

- No new targeting logic.
- No changes to `FeatureNoticeModal`, `FeatureNoticeContainer`, or the notices
  API routes.
- No analytics/telemetry.
- The webp asset creation (handled by the user).
