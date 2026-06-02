# Edit Book Dates — Design

**Date:** 2026-06-02
**Branch:** `feat/edit-book-dates`
**Status:** Approved

## Problem

Users have no way to edit the dates they started, finished, or DNF'd a book.
The `EditBookModal` only exposes a single date field, and only for DNF books
("When did you stop reading?"). There is no way to set or correct a book's
**start date** (any status) or the **finish date** for a **Completed** book.

## Background / Current State

- `UserBook` has exactly two date fields: `startDate` and `finishDate`. There is
  **no separate DNF date** — DNF books reuse `finishDate` as the "stopped reading"
  date.
- The PATCH route `src/app/api/user/books/[id]/route.ts` **already accepts and
  persists** `startDate` and `finishDate` (lines ~135–136). It performs **no**
  date validation.
- `EditBookModal` is rendered only from `src/components/dashboard/BookCard.tsx`.
  `book.startDate` is already available there (it is passed to `BookDetailsModal`).

## Scope

- **In scope:** Surface start/finish date editing in `EditBookModal`'s Basic Info
  tab; per-status disable/label behavior; clear-on-disable semantics; client +
  server date validation; fix a latent `new Date(null)` bug in the PATCH route;
  unit tests.
- **Out of scope:** Schema changes, a separate DNF date column, inline editing on
  cards/detail pages, editing dates anywhere other than `EditBookModal`.

## Approach

Extend the existing `EditBookModal` → **Basic Info** tab. No new modal and no
schema migration. Work breaks into: UI fields, disable/label logic, clear-on-save
logic, validation (client + server), a one-line wiring change in `BookCard`, and
tests.

## UI Changes — `EditBookModal` Basic Info tab

Directly below the **Reading Status** dropdown, add a **two-column row**:
`Started` (left) | finish-date (right). This replaces the current standalone
"When did you stop reading?" field.

Disable state and right-column label are driven by the currently selected status:

| Status        | Left: "Started" | Right column                  |
| ------------- | --------------- | ----------------------------- |
| Want to Read  | disabled        | disabled — label "Finished"   |
| Reading       | enabled         | disabled — label "Finished"   |
| Completed     | enabled         | enabled  — label "Finished"   |
| DNF           | enabled         | enabled  — label "Stopped reading" |

- Both inputs are `type="date"` with `max={today}` (blocks future dates at the
  input level).
- Disabled inputs use the existing Tailwind disabled styling (greyed).
- The **DNF Reason** textarea is unchanged and still shown only when status is DNF,
  positioned below the date row.

## Clear-on-disable Semantics

When a field is disabled for the chosen status, its value is **cleared on save**
(sent as `null`), so stored data always matches the status:

- → **Reading**: `finishDate` sent as `null`.
- → **Want to Read**: both `startDate` and `finishDate` sent as `null`.
- → **Completed / DNF**: send the (enabled) input values.

Trade-off: an accidental status flip discards a date; it is recoverable by
re-entering it. Chosen deliberately over preserving contradictory data (e.g. a
"Reading" book with a stored finish date).

## Validation (client + server)

Both rules enforced; the server re-validates and never trusts the client.

1. **finish ≥ start** — if both dates are present and finish is before start,
   show an inline error and block save (client); return `400` (server).
2. **no future dates** — neither start nor finish may be after today; inline error
   + blocked save (client); `400` (server).

### API bug fix

The current route does `updateData.finishDate = new Date(finishDate)`. Passing
`null` would produce `new Date(null)` === the Unix epoch (1970), corrupting data.
The route will treat `null` as an explicit clear:

```ts
if (startDate !== undefined) updateData.startDate = startDate === null ? null : new Date(startDate)
if (finishDate !== undefined) updateData.finishDate = finishDate === null ? null : new Date(finishDate)
```

Server-side validation runs against the resulting effective dates before the
update is applied.

## Wiring Change — `BookCard.tsx`

- Add `startDate: book.startDate` to the `book` prop passed into `EditBookModal`.
- Add `startDate?: Date | null` to `EditBookModal`'s props interface.

## Testing Plan

New feature ⇒ new unit tests, extending the existing suites.

### `__tests__/components/EditBookModal.test.tsx` (component)

- Started field disabled for Want-to-Read; enabled for Reading/Completed/DNF.
- Finish field disabled for Want-to-Read & Reading; enabled for Completed/DNF.
- Right-column label = "Finished" for Completed, "Stopped reading" for DNF.
- Editing Started + Finished on a Completed book sends correct `startDate` /
  `finishDate` in the PATCH body.
- Inline error + blocked save when finish < start.
- Inline error + blocked save on a future date.
- Completed → Reading sends `finishDate: null`; Completed → Want-to-Read sends both
  `null`.

### `__tests__/api/user-books-dnf-patch.test.ts` (or sibling route test)

- `null` finishDate clears the field (asserts it is **not** epoch/1970).
- `400` when finish < start.
- `400` on a future date.
- Status → Reading clears `finishDate`; status → Want-to-Read clears both.

## Verification

Before any commit: `npm run lint`, type-check (via `npm run build`),
`npm run test`, and `npm run build` must all pass — including pre-existing issues,
per project rules. No commit or push without explicit approval.
