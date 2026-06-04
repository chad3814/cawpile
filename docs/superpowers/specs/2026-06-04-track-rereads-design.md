# Track Re-reads & Resolve Duplicate-Tracking Edge Cases

**Date:** 2026-06-04
**Branch:** `feat/track-rereads`

## Problem

Tracking a book that is already in the user's library silently fails.
`POST /api/user/books` rejects any second track of a `(userId, editionId)` pair
with a 400 (`"Book already in library"`), and `AddBookWizard` swallows that error
(`console.error` with a "show error toast" TODO), so the user sees nothing happen.

Additionally, the `UserBook` unique constraint on `(userId, editionId)` makes it
structurally impossible to record a re-read as a separate reading event.

## Goals

1. Allow a re-read to be tracked as a separate `UserBook` record from the original read.
2. Resolve duplicate-tracking transitions intelligently instead of failing:
   - TBR → READING: change status in place and set the start date.
   - Same live status (both TBR, or both READING): do nothing.
   - READING → TBR: move it back to TBR.
   - Existing record terminal (COMPLETED or DNF): treat the new track as a re-read.
3. Surface clear feedback to the user (the silent failure is the core complaint).

## Schema Change

`UserBook` (prisma/schema.prisma):

- Remove `@@unique([userId, editionId])`.
- Add `readNumber Int @default(1)`.
- Add `@@unique([userId, editionId, readNumber])` — preserves integrity and orders reads.
- Reuse the existing `isReread Boolean? @default(false)` field. Its value is **strictly
  user-controlled** — the application never forces it.

A new Prisma migration drops the old unique index, adds the `readNumber` column
(existing rows backfill to the default `1`), and creates the composite unique index.
Because every existing row currently satisfies `(userId, editionId)` uniqueness, they
all satisfy `(userId, editionId, 1)` uniqueness after the backfill.

## Decision Logic

A pure, unit-testable function:

```
src/lib/db/resolveTrackingAction.ts
```

```ts
type TrackAction =
  | { kind: 'create' }
  | { kind: 'noop'; userBookId: string }
  | { kind: 'update'; userBookId: string }
  | { kind: 'reread'; readNumber: number }

function resolveTrackingAction(
  latest: { id: string; status: BookStatus; readNumber: number } | null,
  requestedStatus: BookStatus,
): TrackAction
```

`latest` is the user's existing `UserBook` for the edition with the **highest**
`readNumber` (or `null` if none).

Rules:

- No `latest` → `create`.
- `latest` terminal (`COMPLETED` or `DNF`) → `reread` (`readNumber: latest.readNumber + 1`).
- `latest` live (`WANT_TO_READ` or `READING`) and `latest.status === requestedStatus` → `noop`.
- `latest` live and `latest.status !== requestedStatus` → `update`.

### Full transition matrix

| latest \ requested | WANT_TO_READ | READING | COMPLETED | DNF |
|---|---|---|---|---|
| **(none)** | create | create | create | create |
| **WANT_TO_READ** | noop | update | update | update |
| **READING** | update | noop | update | update |
| **COMPLETED** | reread | reread | reread | reread |
| **DNF** | reread | reread | reread | reread |

## Route Behavior — `POST /api/user/books`

The 400 "Book already in library" block is removed. After resolving the action,
all writes happen inside the existing `$transaction`:

- **create** — as today: new row, `readNumber: 1`, `isReread` from request.
- **reread** — new row, `readNumber: latest.readNumber + 1`, `isReread` from request
  (not forced), status/dates/format/tracking fields from request.
- **update** — mutate the `latest` row in place. Field rules by requested status:
  - → READING: `status = READING`, `startDate = provided ?? now`.
  - → WANT_TO_READ: `status = WANT_TO_READ`, `startDate = null` (cleared);
    `progress` and `currentPage` are **kept**.
  - → COMPLETED: `status = COMPLETED`, `finishDate = provided ?? now`, `progress = 100`.
  - → DNF: `status = DNF`, `finishDate = provided dnfDate ?? now`, `dnfReason` from request.
  - Submitted `format` and tracking fields (acquisitionMethod, bookClubName,
    readathonName, isReread) are applied.
- **noop** — no writes; return the existing row.

`recomputeBookStats` and the book-club / readathon autocomplete upserts run for
`create` / `reread` / `update`, and are skipped for `noop`.

The unique constraint on `(userId, editionId, readNumber)` guards against a race
that computes the same next `readNumber` twice; the work runs inside the existing
transaction.

### Response shape

```ts
{ userBook, action, message }
// action: 'created' | 'reread' | 'updated' | 'noop'
```

Messages (examples): `"Added to your library"`, `"Added as a re-read"`,
`"Moved to Currently Reading"`, `"Moved to Want to Read"`, `"Already on your TBR"`,
`"Already in Currently Reading"`.

## Re-read Detection — `POST /api/user/books/tracking-status`

A new **non-mutating** endpoint so the wizard can detect a re-read before submit.

- Auth required; verifies the signed result signature.
- Find-only book + edition lookup (no create), mirroring the matching used by
  `findOrCreateEditionFromSignedResult` (book by `(title, authors)`; edition by
  `OR` of `googleBooksId` / `isbn10` / `isbn13`).
- Returns the user's latest `UserBook` for that edition: `{ status, readNumber }`,
  or `{ status: null }` if not tracked / edition not found.

A new find-only helper is added to `src/lib/db/books.ts`
(e.g. `findExistingEdition(signedResult)`) so both the lookup endpoint and any future
caller can resolve an edition without creating one.

## Client — `AddBookWizard`

- When a book is selected, call `tracking-status`. If the latest status is
  `COMPLETED` or `DNF`, default the wizard's `isReread` toggle to `true`
  (the user can still change it; the DB stores exactly what they submit).
- On submit success, show the API `message` via the existing
  `useToast` / `ToastContainer` (`src/components/admin/Toast.tsx`).
- On failure, show an error toast instead of the silent `console.error`.
- The `ToastContainer` is rendered outside the `Dialog` so it persists after the
  wizard closes (the wizard component stays mounted; Header/EmptyLibrary only toggle
  `isOpen`).

## Testing

- **Unit** (`resolveTrackingAction`): the full 4×4 matrix plus the `null` case.
- **API** (`POST /api/user/books`, mocked-prisma style matching `__tests__/api/`):
  - re-read of a COMPLETED/DNF book creates a new row with incremented `readNumber`
    and `isReread` equal to the submitted value (verifying it is not forced true);
  - TBR → READING updates in place and sets `startDate`;
  - READING → TBR clears `startDate` and keeps `progress`;
  - both-TBR and both-READING are no-ops (no new row, no field changes);
  - live → terminal (e.g. READING → COMPLETED) updates in place.
- **API** (`tracking-status`): returns latest status for a tracked book; returns
  `null` for an untracked book; verifies signature rejection.

## Out of Scope

- No global toast/notification system; reuse the existing admin `Toast` component.
- No changes to library display ordering for multiple reads beyond what the existing
  `(userId, createdAt)` / `(userId, status, isPinned, sortOrder)` indexes provide.
