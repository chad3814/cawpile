# Track Re-reads & Duplicate-Tracking Edge Cases — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow tracking a book that is already in the library — recording re-reads as separate records and resolving status transitions intelligently — instead of silently failing.

**Architecture:** A new Prisma `readNumber` ordinal replaces the `(userId, editionId)` unique constraint so multiple reads can coexist. A pure `resolveTrackingAction()` function classifies each track request into `create` / `noop` / `update` / `reread`; `POST /api/user/books` executes the action. A new non-mutating `tracking-status` endpoint lets `AddBookWizard` detect a re-read and default its `isReread` toggle, and the wizard shows toast feedback.

**Tech Stack:** Next.js 16 App Router, Prisma v6, PostgreSQL (Neon), TypeScript, Jest (real-PrismaClient integration tests + unit tests), React 19.

**Spec:** `docs/superpowers/specs/2026-06-04-track-rereads-design.md`

---

## Conventions for every task

- 2-space indent, semicolons on optional lines, no `any`/`unknown`.
- Run lint/type-check/test/build before considering the feature done (Task 7). Per-task you run the task's own tests.
- Commit messages use Conventional Commits. **Do not push.**
- Test commands run from the worktree root `/Users/cwalker/Projects/cawpile/track-rereads`.
- API integration tests follow the real-`PrismaClient` pattern in `__tests__/api/user-books-dnf-patch.test.ts` (create real rows, mock only `@/lib/auth-helpers`). They require `@jest-environment node`.

## File Structure

- Modify: `prisma/schema.prisma` — drop unique, add `readNumber` + composite unique (Task 1).
- Create: `prisma/migrations/<timestamp>_track_rereads/migration.sql` — generated (Task 1).
- Create: `src/lib/db/resolveTrackingAction.ts` — pure decision logic (Task 2).
- Create: `__tests__/lib/db/resolveTrackingAction.test.ts` — matrix unit tests (Task 2).
- Modify: `src/lib/db/books.ts` — add `findExistingEdition()`, reuse it in `findOrCreateEditionFromSignedResult` (Task 3).
- Create: `__tests__/lib/db/findExistingEdition.test.ts` (Task 3).
- Modify: `src/app/api/user/books/route.ts` — replace the 400 block with action execution + response (Task 4).
- Create: `__tests__/api/user-books-track-rereads.test.ts` (Task 4).
- Create: `src/app/api/user/books/tracking-status/route.ts` (Task 5).
- Create: `__tests__/api/user-books-tracking-status.test.ts` (Task 5).
- Modify: `src/components/modals/AddBookWizard.tsx` — toast feedback + re-read detection (Task 6).
- Modify: `__tests__/components/AddBookWizard.test.tsx` (Task 6).

---

## Task 1: Schema — `readNumber` + drop `(userId, editionId)` unique

**Files:**
- Modify: `prisma/schema.prisma` (UserBook model, ~221-268)
- Create: `prisma/migrations/<timestamp>_track_rereads/migration.sql` (generated)

- [ ] **Step 1: Edit the schema**

In `prisma/schema.prisma`, in `model UserBook`, add the `readNumber` field next to the other tracking fields (after `isReread`):

```prisma
  isReread                 Boolean? @default(false)
  readNumber               Int      @default(1)
```

Then change the constraints block at the bottom of the model. Replace:

```prisma
  @@unique([userId, editionId])
  @@index([userId, createdAt])
  @@index([userId, status, isPinned, sortOrder])
```

with:

```prisma
  @@unique([userId, editionId, readNumber])
  @@index([userId, createdAt])
  @@index([userId, status, isPinned, sortOrder])
```

- [ ] **Step 2: Generate and apply the migration**

Run: `npx prisma migrate dev --name track_rereads`
Expected: a new migration directory is created, the migration applies cleanly, and `prisma generate` runs. Existing rows get `readNumber = 1` via the column default.

- [ ] **Step 3: Verify the generated SQL**

Run: `cat prisma/migrations/*track_rereads/migration.sql`
Expected: it drops index `UserBook_userId_editionId_key`, adds column `readNumber` with default `1`, and creates unique index `UserBook_userId_editionId_readNumber_key`. If `prisma migrate dev` instead wants to reset data, STOP and report — do not accept a destructive migration.

- [ ] **Step 4: Type-check (Prisma client picks up `readNumber`)**

Run: `npx tsc --noEmit`
Expected: PASS (no errors from the schema change alone).

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma prisma/migrations
git commit -m "feat(db): add readNumber and drop (userId, editionId) unique on UserBook"
```

---

## Task 2: Pure decision logic — `resolveTrackingAction`

**Files:**
- Create: `src/lib/db/resolveTrackingAction.ts`
- Test: `__tests__/lib/db/resolveTrackingAction.test.ts`

- [ ] **Step 1: Write the failing test**

Create `__tests__/lib/db/resolveTrackingAction.test.ts`:

```ts
import { BookStatus } from '@prisma/client'
import { resolveTrackingAction } from '@/lib/db/resolveTrackingAction'

const { WANT_TO_READ, READING, COMPLETED, DNF } = BookStatus
const allStatuses = [WANT_TO_READ, READING, COMPLETED, DNF] as const

function latest(status: BookStatus, readNumber = 1) {
  return { id: 'ub1', status, readNumber }
}

describe('resolveTrackingAction', () => {
  it('creates when there is no existing record', () => {
    for (const s of allStatuses) {
      expect(resolveTrackingAction(null, s)).toEqual({ kind: 'create' })
    }
  })

  it('re-reads for every requested status when latest is COMPLETED', () => {
    for (const s of allStatuses) {
      expect(resolveTrackingAction(latest(COMPLETED, 2), s)).toEqual({ kind: 'reread', readNumber: 3 })
    }
  })

  it('re-reads for every requested status when latest is DNF', () => {
    for (const s of allStatuses) {
      expect(resolveTrackingAction(latest(DNF, 1), s)).toEqual({ kind: 'reread', readNumber: 2 })
    }
  })

  it('no-ops when latest and requested are both WANT_TO_READ', () => {
    expect(resolveTrackingAction(latest(WANT_TO_READ), WANT_TO_READ)).toEqual({ kind: 'noop', userBookId: 'ub1' })
  })

  it('no-ops when latest and requested are both READING', () => {
    expect(resolveTrackingAction(latest(READING), READING)).toEqual({ kind: 'noop', userBookId: 'ub1' })
  })

  it('updates TBR -> READING / COMPLETED / DNF', () => {
    for (const s of [READING, COMPLETED, DNF]) {
      expect(resolveTrackingAction(latest(WANT_TO_READ), s)).toEqual({ kind: 'update', userBookId: 'ub1' })
    }
  })

  it('updates READING -> TBR / COMPLETED / DNF', () => {
    for (const s of [WANT_TO_READ, COMPLETED, DNF]) {
      expect(resolveTrackingAction(latest(READING), s)).toEqual({ kind: 'update', userBookId: 'ub1' })
    }
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest __tests__/lib/db/resolveTrackingAction.test.ts`
Expected: FAIL — cannot find module `@/lib/db/resolveTrackingAction`.

- [ ] **Step 3: Write the implementation**

Create `src/lib/db/resolveTrackingAction.ts`:

```ts
import { BookStatus } from '@prisma/client'

export type TrackAction =
  | { kind: 'create' }
  | { kind: 'noop'; userBookId: string }
  | { kind: 'update'; userBookId: string }
  | { kind: 'reread'; readNumber: number }

/** The latest (highest readNumber) UserBook for a (user, edition), or null. */
export interface LatestUserBook {
  id: string
  status: BookStatus
  readNumber: number
}

export function isTerminalStatus(status: BookStatus): boolean {
  return status === BookStatus.COMPLETED || status === BookStatus.DNF
}

/**
 * Decide what happens when a user tracks a book they may already have tracked.
 * - No existing record -> create a first record.
 * - Latest is terminal (COMPLETED/DNF) -> always a re-read (new record).
 * - Latest is live and same status -> no-op.
 * - Latest is live and different status -> update the existing record in place.
 */
export function resolveTrackingAction(
  latest: LatestUserBook | null,
  requestedStatus: BookStatus,
): TrackAction {
  if (!latest) {
    return { kind: 'create' }
  }
  if (isTerminalStatus(latest.status)) {
    return { kind: 'reread', readNumber: latest.readNumber + 1 }
  }
  if (latest.status === requestedStatus) {
    return { kind: 'noop', userBookId: latest.id }
  }
  return { kind: 'update', userBookId: latest.id }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest __tests__/lib/db/resolveTrackingAction.test.ts`
Expected: PASS (7 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/db/resolveTrackingAction.ts __tests__/lib/db/resolveTrackingAction.test.ts
git commit -m "feat(books): add resolveTrackingAction decision logic for re-tracking"
```

---

## Task 3: Find-only edition lookup — `findExistingEdition`

**Files:**
- Modify: `src/lib/db/books.ts` (add export; reuse in `findOrCreateEditionFromSignedResult`, ~439-462)
- Test: `__tests__/lib/db/findExistingEdition.test.ts`

- [ ] **Step 1: Write the failing test**

Create `__tests__/lib/db/findExistingEdition.test.ts`:

```ts
/**
 * @jest-environment node
 */
import { PrismaClient } from '@prisma/client'
import { nanoid } from 'nanoid'
import type { SignedBookSearchResult } from '@/lib/search/types'
import { findExistingEdition } from '@/lib/db/books'

const prisma = new PrismaClient()

describe('findExistingEdition', () => {
  let bookId: string
  let editionId: string
  const isbn13 = `978${Math.floor(Math.random() * 1e9)}`

  beforeAll(async () => {
    const book = await prisma.book.create({
      data: { title: `Find Edition ${nanoid(6)}`, authors: ['Author'] },
    })
    bookId = book.id
    const edition = await prisma.edition.create({
      data: { bookId, isbn13 },
    })
    editionId = edition.id
  })

  afterAll(async () => {
    await prisma.edition.deleteMany({ where: { bookId } })
    await prisma.book.delete({ where: { id: bookId } })
    await prisma.$disconnect()
  })

  it('finds an edition by isbn13', async () => {
    const signed: SignedBookSearchResult = {
      id: 'x', googleId: '', title: 'x', authors: ['Author'], categories: [],
      isbn13, sources: [],
    }
    const found = await findExistingEdition(signed)
    expect(found?.id).toBe(editionId)
  })

  it('returns null when no identifiers match', async () => {
    const signed: SignedBookSearchResult = {
      id: 'x', googleId: '', title: 'x', authors: ['Author'], categories: [],
      isbn13: `978${Math.floor(Math.random() * 1e9)}`, sources: [],
    }
    expect(await findExistingEdition(signed)).toBeNull()
  })

  it('returns null when the signed result carries no identifiers', async () => {
    const signed: SignedBookSearchResult = {
      id: 'x', googleId: '', title: 'x', authors: ['Author'], categories: [], sources: [],
    }
    expect(await findExistingEdition(signed)).toBeNull()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest __tests__/lib/db/findExistingEdition.test.ts`
Expected: FAIL — `findExistingEdition` is not exported from `@/lib/db/books`.

- [ ] **Step 3: Add `findExistingEdition` and reuse it**

In `src/lib/db/books.ts`, add this exported function (place it directly above `findOrCreateEditionFromSignedResult`):

```ts
/**
 * Find an existing edition matching a signed search result WITHOUT creating one.
 * Mirrors the matching used by findOrCreateEditionFromSignedResult
 * (googleBooksId / isbn10 / isbn13). Returns null if nothing matches.
 */
export async function findExistingEdition(
  signedResult: SignedBookSearchResult,
): Promise<Edition | null> {
  const whereConditions: Prisma.EditionWhereInput[] = []

  const googleSource = signedResult.sources?.find((s) => s.provider === 'google')
  const googleId = googleSource?.data?.googleId || googleSource?.data?.id || signedResult.googleId
  if (googleId) {
    whereConditions.push({ googleBooksId: googleId })
  }
  if (signedResult.isbn10) {
    whereConditions.push({ isbn10: signedResult.isbn10 })
  }
  if (signedResult.isbn13) {
    whereConditions.push({ isbn13: signedResult.isbn13 })
  }

  if (whereConditions.length === 0) {
    return null
  }

  return prisma.edition.findFirst({ where: { OR: whereConditions } })
}
```

Then, inside `findOrCreateEditionFromSignedResult`, replace the block that builds `whereConditions` and assigns `existingEdition` (from `const whereConditions: Prisma.EditionWhereInput[] = []` through the `prisma.edition.findFirst({ where: { OR: whereConditions } })` assignment) with a single call:

```ts
  // Try to find an existing edition (no create) using shared matching logic.
  const existingEdition = await findExistingEdition(signedResult)
```

Keep the rest of `findOrCreateEditionFromSignedResult` (the create path and provider upserts) unchanged. Note: `existingEdition` becomes `const` — if later code reassigns it, leave it as `let existingEdition = await findExistingEdition(signedResult)` instead. Verify by reading the function after the edit.

- [ ] **Step 4: Run the test + the existing edition test to verify no regression**

Run: `npx jest __tests__/lib/db/findExistingEdition.test.ts __tests__/lib/db/upsertAmazonBook.test.ts`
Expected: PASS (both suites).

- [ ] **Step 5: Commit**

```bash
git add src/lib/db/books.ts __tests__/lib/db/findExistingEdition.test.ts
git commit -m "feat(books): add findExistingEdition find-only lookup and reuse in findOrCreate"
```

---

## Task 4: Route — execute the tracking action in `POST /api/user/books`

**Files:**
- Modify: `src/app/api/user/books/route.ts` (replace lines ~101-194)
- Test: `__tests__/api/user-books-track-rereads.test.ts`

- [ ] **Step 1: Replace the existing-book 400 block with action execution**

In `src/app/api/user/books/route.ts`:

Add to imports at the top:

```ts
import { resolveTrackingAction } from '@/lib/db/resolveTrackingAction'
```

Add `dnfReason` to the destructured body and its type (in the `const { ... } = body as { ... }` block):

```ts
      readathonName,
      isReread,
      dnfReason
    } = body as {
```
```ts
      readathonName?: string
      isReread?: boolean
      dnfReason?: string
    }
```

Now replace everything from the `// Check if user already has this book` comment (the `existingUserBook` lookup and its 400 return) through the end of the `userBook` transaction and `return NextResponse.json({ userBook })` — i.e. lines ~101-194 — with:

```ts
    // Find the user's latest read of this edition (highest readNumber), if any.
    const latest = await prisma.userBook.findFirst({
      where: { userId: user.id, editionId: edition.id },
      orderBy: { readNumber: 'desc' },
      select: { id: true, status: true, readNumber: true, startDate: true, isReread: true },
    })

    const action = resolveTrackingAction(latest, status)

    // A no-op: the book is already in the requested live status. Return it unchanged.
    if (action.kind === 'noop') {
      const existing = await prisma.userBook.findUnique({
        where: { id: action.userBookId },
        include: {
          edition: {
            include: { book: true, googleBook: true, hardcoverBook: true, ibdbBook: true, amazonBook: true },
          },
        },
      })
      const message =
        latest?.status === BookStatus.READING ? 'Already in Currently Reading' : 'Already on your TBR'
      return NextResponse.json({ userBook: existing, action: 'noop', message })
    }

    // Store book club / readathon autocomplete entries (create/update/reread only).
    if (bookClubName) {
      await prisma.userBookClub.upsert({
        where: { userId_name: { userId: user.id, name: bookClubName } },
        update: { lastUsed: new Date(), usageCount: { increment: 1 } },
        create: { userId: user.id, name: bookClubName },
      })
    }
    if (readathonName) {
      await prisma.userReadathon.upsert({
        where: { userId_name: { userId: user.id, name: readathonName } },
        update: { lastUsed: new Date(), usageCount: { increment: 1 } },
        create: { userId: user.id, name: readathonName },
      })
    }

    const includeEdition = {
      edition: {
        include: { book: true, googleBook: true, hardcoverBook: true, ibdbBook: true, amazonBook: true },
      },
    }

    // Shared tracking fields applied to every write.
    const trackingFields = {
      format: uniqueFormats,
      acquisitionMethod,
      acquisitionOther: acquisitionMethod === 'Other' ? acquisitionOther : null,
      bookClubName,
      readathonName,
      isReread: isReread || false,
    }

    let userBook
    let responseAction: 'created' | 'reread' | 'updated'
    let message: string

    if (action.kind === 'update') {
      // Build status-specific date/progress changes for an in-place update.
      const updateData: Prisma.UserBookUpdateInput = { status, ...trackingFields }
      if (status === BookStatus.READING) {
        updateData.startDate = startDate ? new Date(startDate) : (latest?.startDate ?? new Date())
        message = 'Moved to Currently Reading'
      } else if (status === BookStatus.WANT_TO_READ) {
        updateData.startDate = null // back to TBR; progress/currentPage are kept
        message = 'Moved to Want to Read'
      } else if (status === BookStatus.COMPLETED) {
        if (startDate) updateData.startDate = new Date(startDate)
        updateData.finishDate = finishDate ? new Date(finishDate) : new Date()
        updateData.progress = 100
        message = 'Marked as completed'
      } else {
        // DNF
        if (startDate) updateData.startDate = new Date(startDate)
        updateData.finishDate = finishDate ? new Date(finishDate) : new Date()
        updateData.dnfReason = dnfReason ?? null
        message = 'Marked as did not finish'
      }

      userBook = await prisma.$transaction(async (tx) => {
        const updated = await tx.userBook.update({
          where: { id: action.userBookId },
          data: updateData,
          include: includeEdition,
        })
        await recomputeBookStats(edition.bookId, tx)
        return updated
      })
      responseAction = 'updated'
    } else {
      // create or reread: a fresh row.
      const readNumber = action.kind === 'reread' ? action.readNumber : 1
      userBook = await prisma.$transaction(async (tx) => {
        const created = await tx.userBook.create({
          data: {
            userId: user.id,
            editionId: edition.id,
            status,
            startDate: startDate ? new Date(startDate) : null,
            finishDate: finishDate ? new Date(finishDate) : null,
            progress: progress || 0,
            dnfReason: status === BookStatus.DNF ? (dnfReason ?? null) : null,
            readNumber,
            ...trackingFields,
          },
          include: includeEdition,
        })
        await recomputeBookStats(edition.bookId, tx)
        return created
      })
      responseAction = action.kind === 'reread' ? 'reread' : 'created'
      message = action.kind === 'reread' ? 'Added as a re-read' : 'Added to your library'
    }

    return NextResponse.json({ userBook, action: responseAction, message })
```

Note: `BookStatus` and `Prisma` are already imported at the top of this file (line 6). `recomputeBookStats` is already imported (line 4).

- [ ] **Step 2: Write the failing integration test**

Create `__tests__/api/user-books-track-rereads.test.ts`:

```ts
/**
 * @jest-environment node
 */
import { PrismaClient, BookStatus } from '@prisma/client'
import { nanoid } from 'nanoid'
import type { SignedBookSearchResult, SourceEntry } from '@/lib/search/types'
import type { BookSearchResult } from '@/types/book'

const prisma = new PrismaClient()

jest.mock('@/lib/auth-helpers', () => ({ getCurrentUser: jest.fn() }))
import { getCurrentUser } from '@/lib/auth-helpers'

const mockGetCurrentUser = getCurrentUser as jest.MockedFunction<typeof getCurrentUser>

describe('POST /api/user/books - re-reads and duplicate tracking', () => {
  let userId: string
  let editionId: string
  let bookId: string
  let signedResult: SignedBookSearchResult
  let POST: typeof import('@/app/api/user/books/route').POST
  let signResult: typeof import('@/lib/search/utils/signResult').signResult

  beforeAll(async () => {
    if (!process.env.SEARCH_SIGNING_SECRET) {
      process.env.SEARCH_SIGNING_SECRET = 'test-signing-secret-minimum-32-characters-long!'
    }
    // Import AFTER the secret is set so signResult/verifySignature use it.
    ;({ POST } = await import('@/app/api/user/books/route'))
    ;({ signResult } = await import('@/lib/search/utils/signResult'))

    const user = await prisma.user.create({
      data: { email: `reread-${nanoid(6)}@test.com`, name: 'Reread User' },
    })
    userId = user.id

    const isbn13 = `978${Math.floor(Math.random() * 1e9)}`
    const book = await prisma.book.create({
      data: { title: `Reread Book ${nanoid(6)}`, authors: ['Author'] },
    })
    bookId = book.id
    const edition = await prisma.edition.create({ data: { bookId, isbn13 } })
    editionId = edition.id

    const sources: SourceEntry[] = [
      { provider: 'google', data: { id: 'g1', googleId: 'g1', title: book.title, authors: ['Author'], categories: [], source: 'google', sourceWeight: 5 } },
    ]
    const base: BookSearchResult & { sources: SourceEntry[] } = {
      id: 'g1', googleId: 'g1', title: book.title, authors: ['Author'], categories: [], isbn13, sources,
    }
    signedResult = { ...base, signature: signResult(base) }
  })

  afterAll(async () => {
    await prisma.userBook.deleteMany({ where: { userId } })
    await prisma.edition.deleteMany({ where: { bookId } })
    await prisma.book.delete({ where: { id: bookId } }).catch(() => {})
    await prisma.user.delete({ where: { id: userId } })
    await prisma.$disconnect()
  })

  beforeEach(async () => {
    await prisma.userBook.deleteMany({ where: { userId } })
    mockGetCurrentUser.mockResolvedValue({ id: userId, email: 'reread@test.com' } as Awaited<ReturnType<typeof getCurrentUser>>)
  })

  function post(body: Record<string, unknown>) {
    return POST(new Request('http://localhost/api/user/books', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ signedResult, format: ['HARDCOVER'], ...body }),
    }) as never)
  }

  it('creates a re-read with incremented readNumber and honors submitted isReread', async () => {
    await prisma.userBook.create({ data: { userId, editionId, status: BookStatus.COMPLETED, readNumber: 1 } })
    const res = await post({ status: 'READING', isReread: false })
    const json = await res.json()
    expect(res.status).toBe(200)
    expect(json.action).toBe('reread')
    expect(json.userBook.readNumber).toBe(2)
    expect(json.userBook.isReread).toBe(false) // not forced true
    const rows = await prisma.userBook.count({ where: { userId, editionId } })
    expect(rows).toBe(2)
  })

  it('updates TBR -> READING in place and sets startDate', async () => {
    const ub = await prisma.userBook.create({ data: { userId, editionId, status: BookStatus.WANT_TO_READ, readNumber: 1 } })
    const res = await post({ status: 'READING', startDate: '2026-01-15' })
    const json = await res.json()
    expect(json.action).toBe('updated')
    expect(json.userBook.id).toBe(ub.id)
    expect(json.userBook.status).toBe('READING')
    expect(json.userBook.startDate).not.toBeNull()
    expect(await prisma.userBook.count({ where: { userId, editionId } })).toBe(1)
  })

  it('moves READING -> TBR, clears startDate, keeps progress', async () => {
    const ub = await prisma.userBook.create({
      data: { userId, editionId, status: BookStatus.READING, readNumber: 1, startDate: new Date('2026-01-01'), progress: 42 },
    })
    const res = await post({ status: 'WANT_TO_READ' })
    const json = await res.json()
    expect(json.action).toBe('updated')
    expect(json.userBook.id).toBe(ub.id)
    expect(json.userBook.status).toBe('WANT_TO_READ')
    expect(json.userBook.startDate).toBeNull()
    expect(json.userBook.progress).toBe(42)
  })

  it('no-ops when already on TBR', async () => {
    await prisma.userBook.create({ data: { userId, editionId, status: BookStatus.WANT_TO_READ, readNumber: 1 } })
    const res = await post({ status: 'WANT_TO_READ' })
    const json = await res.json()
    expect(json.action).toBe('noop')
    expect(json.message).toBe('Already on your TBR')
    expect(await prisma.userBook.count({ where: { userId, editionId } })).toBe(1)
  })

  it('no-ops when already Currently Reading', async () => {
    await prisma.userBook.create({ data: { userId, editionId, status: BookStatus.READING, readNumber: 1 } })
    const res = await post({ status: 'READING' })
    const json = await res.json()
    expect(json.action).toBe('noop')
    expect(json.message).toBe('Already in Currently Reading')
  })

  it('creates a first record when none exists', async () => {
    const res = await post({ status: 'WANT_TO_READ' })
    const json = await res.json()
    expect(json.action).toBe('created')
    expect(json.userBook.readNumber).toBe(1)
  })
})
```

- [ ] **Step 3: Run the test to verify it passes**

Run: `npx jest __tests__/api/user-books-track-rereads.test.ts`
Expected: PASS (6 tests). If the create/reread/update assertions fail on serialized dates, confirm the response field names match `UserBook` (`startDate`, `progress`, `readNumber`, `isReread`).

- [ ] **Step 4: Run the existing books-feed test to confirm no regression**

Run: `npx jest __tests__/api/books-feed.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/user/books/route.ts __tests__/api/user-books-track-rereads.test.ts
git commit -m "feat(books): resolve duplicate tracking and record re-reads in POST /api/user/books"
```

---

## Task 5: Non-mutating `tracking-status` endpoint

**Files:**
- Create: `src/app/api/user/books/tracking-status/route.ts`
- Test: `__tests__/api/user-books-tracking-status.test.ts`

- [ ] **Step 1: Write the endpoint**

Create `src/app/api/user/books/tracking-status/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-helpers'
import prisma from '@/lib/prisma'
import { findExistingEdition } from '@/lib/db/books'
import { verifySignature } from '@/lib/search/utils/signResult'
import type { SignedBookSearchResult } from '@/lib/search/types'

/**
 * Returns the current user's latest tracking status for a searched book,
 * WITHOUT creating any book/edition/userBook rows. Used by AddBookWizard to
 * detect a re-read and default its isReread toggle.
 */
export async function POST(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { signedResult } = body as { signedResult: SignedBookSearchResult }

    if (!signedResult) {
      return NextResponse.json({ error: 'Signed result is required' }, { status: 400 })
    }
    if (!verifySignature(signedResult)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    const edition = await findExistingEdition(signedResult)
    if (!edition) {
      return NextResponse.json({ status: null, readNumber: 0 })
    }

    const latest = await prisma.userBook.findFirst({
      where: { userId: user.id, editionId: edition.id },
      orderBy: { readNumber: 'desc' },
      select: { status: true, readNumber: true },
    })

    return NextResponse.json({
      status: latest?.status ?? null,
      readNumber: latest?.readNumber ?? 0,
    })
  } catch (error) {
    console.error('Error checking tracking status:', error)
    return NextResponse.json({ error: 'Failed to check tracking status' }, { status: 500 })
  }
}
```

- [ ] **Step 2: Write the failing test**

Create `__tests__/api/user-books-tracking-status.test.ts`:

```ts
/**
 * @jest-environment node
 */
import { PrismaClient, BookStatus } from '@prisma/client'
import { nanoid } from 'nanoid'
import type { SignedBookSearchResult, SourceEntry } from '@/lib/search/types'
import type { BookSearchResult } from '@/types/book'

const prisma = new PrismaClient()

jest.mock('@/lib/auth-helpers', () => ({ getCurrentUser: jest.fn() }))
import { getCurrentUser } from '@/lib/auth-helpers'
const mockGetCurrentUser = getCurrentUser as jest.MockedFunction<typeof getCurrentUser>

describe('POST /api/user/books/tracking-status', () => {
  let userId: string
  let bookId: string
  let editionId: string
  let signedResult: SignedBookSearchResult
  let POST: typeof import('@/app/api/user/books/tracking-status/route').POST

  beforeAll(async () => {
    if (!process.env.SEARCH_SIGNING_SECRET) {
      process.env.SEARCH_SIGNING_SECRET = 'test-signing-secret-minimum-32-characters-long!'
    }
    const { POST: handler } = await import('@/app/api/user/books/tracking-status/route')
    POST = handler
    const { signResult } = await import('@/lib/search/utils/signResult')

    const user = await prisma.user.create({ data: { email: `ts-${nanoid(6)}@test.com`, name: 'TS User' } })
    userId = user.id
    const isbn13 = `978${Math.floor(Math.random() * 1e9)}`
    const book = await prisma.book.create({ data: { title: `TS Book ${nanoid(6)}`, authors: ['Author'] } })
    bookId = book.id
    const edition = await prisma.edition.create({ data: { bookId, isbn13 } })
    editionId = edition.id

    const sources: SourceEntry[] = [
      { provider: 'google', data: { id: 'g1', googleId: 'g1', title: book.title, authors: ['Author'], categories: [], source: 'google', sourceWeight: 5 } },
    ]
    const base: BookSearchResult & { sources: SourceEntry[] } = {
      id: 'g1', googleId: 'g1', title: book.title, authors: ['Author'], categories: [], isbn13, sources,
    }
    signedResult = { ...base, signature: signResult(base) }
    mockGetCurrentUser.mockResolvedValue({ id: userId, email: 'ts@test.com' } as Awaited<ReturnType<typeof getCurrentUser>>)
  })

  afterAll(async () => {
    await prisma.userBook.deleteMany({ where: { userId } })
    await prisma.edition.deleteMany({ where: { bookId } })
    await prisma.book.delete({ where: { id: bookId } }).catch(() => {})
    await prisma.user.delete({ where: { id: userId } })
    await prisma.$disconnect()
  })

  function post(body: Record<string, unknown>) {
    return POST(new Request('http://localhost/api/user/books/tracking-status', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    }) as never)
  }

  it('returns null status for an untracked book', async () => {
    await prisma.userBook.deleteMany({ where: { userId } })
    const json = await (await post({ signedResult })).json()
    expect(json.status).toBeNull()
    expect(json.readNumber).toBe(0)
  })

  it('returns the latest status for a tracked book', async () => {
    await prisma.userBook.deleteMany({ where: { userId } })
    await prisma.userBook.create({ data: { userId, editionId, status: BookStatus.COMPLETED, readNumber: 1 } })
    const json = await (await post({ signedResult })).json()
    expect(json.status).toBe('COMPLETED')
    expect(json.readNumber).toBe(1)
  })

  it('rejects an invalid signature', async () => {
    const res = await post({ signedResult: { ...signedResult, signature: 'bad' } })
    expect(res.status).toBe(400)
  })
})
```

- [ ] **Step 3: Run the test to verify it passes**

Run: `npx jest __tests__/api/user-books-tracking-status.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 4: Commit**

```bash
git add src/app/api/user/books/tracking-status/route.ts __tests__/api/user-books-tracking-status.test.ts
git commit -m "feat(books): add non-mutating tracking-status endpoint for re-read detection"
```

---

## Task 6: Wizard — toast feedback + re-read detection

**Files:**
- Modify: `src/components/modals/AddBookWizard.tsx`
- Test: `__tests__/components/AddBookWizard.test.tsx`

- [ ] **Step 1: Add toast + re-read detection to the wizard**

In `src/components/modals/AddBookWizard.tsx`:

Add imports near the other component imports:

```ts
import { ToastContainer, useToast } from '@/components/admin/Toast'
```

Inside the component, after the existing `useState` declarations (after `formData`), add:

```ts
  const { messages, showToast, removeToast } = useToast()
```

Add an effect that detects a re-read when the wizard opens with a book (place it after the escape-key effect, ~line 123):

```ts
  // Detect a re-read: if the user previously finished/DNF'd this book, default isReread on.
  useEffect(() => {
    if (!isOpen || !book) return
    let cancelled = false
    fetch('/api/user/books/tracking-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ signedResult: book }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { status: string | null } | null) => {
        if (cancelled || !data) return
        if (data.status === 'COMPLETED' || data.status === 'DNF') {
          setFormData((prev) => ({ ...prev, isReread: true }))
        }
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [isOpen, book])
```

In the submit handler, replace the success path and the `catch` block. Change:

```ts
      if (!response.ok) {
        throw new Error('Failed to add book')
      }

      onComplete()
      handleClose()
    } catch (error) {
      console.error('Error adding book:', error)
      // In production, show error toast
    } finally {
      setIsSubmitting(false)
    }
```

to:

```ts
      if (!response.ok) {
        throw new Error('Failed to add book')
      }

      const data: { message?: string } = await response.json().catch(() => ({}))
      showToast('success', data.message || 'Added to your library')
      onComplete()
      handleClose()
    } catch (error) {
      console.error('Error adding book:', error)
      showToast('error', 'Could not track this book. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
```

Render the toast container outside the `Dialog` so it survives the wizard closing. Change the top of the returned JSX from:

```tsx
  return (
    <Transition appear show={isOpen} as={Fragment}>
```

to:

```tsx
  return (
    <>
    <ToastContainer messages={messages} onClose={removeToast} />
    <Transition appear show={isOpen} as={Fragment}>
```

and close the fragment at the very end of the returned JSX (after the closing `</Transition>`):

```tsx
    </Transition>
    </>
  )
```

Verify by reading the end of the component to place the closing tags correctly.

- [ ] **Step 2: Add tests to the wizard suite**

In `__tests__/components/AddBookWizard.test.tsx`, add `fetch` handling for the new `tracking-status` call and a test that a success toast appears. First inspect the file's existing `global.fetch` mock. Add these tests inside the top-level `describe`:

```ts
  it('defaults isReread when the book was previously completed', async () => {
    // tracking-status returns COMPLETED, so the reread toggle should turn on.
    global.fetch = jest.fn((url: string) => {
      if (typeof url === 'string' && url.includes('tracking-status')) {
        return Promise.resolve({ ok: true, json: async () => ({ status: 'COMPLETED', readNumber: 1 }) } as Response)
      }
      return Promise.resolve({ ok: true, json: async () => ({ userBook: {}, action: 'reread', message: 'Added as a re-read' }) } as Response)
    }) as jest.Mock

    render(<AddBookWizard isOpen book={mockBook} onClose={jest.fn()} onComplete={jest.fn()} />)
    // The reread field is on the tracking step; assert the fetch was made.
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/user/books/tracking-status',
        expect.objectContaining({ method: 'POST' }),
      )
    })
  })
```

Adapt `mockBook`, `render`, `waitFor`, and import names to whatever the existing test file already defines (read it first — reuse its `mockBook`/render helpers; do not introduce a second copy).

- [ ] **Step 3: Run the wizard test suite**

Run: `npx jest __tests__/components/AddBookWizard.test.tsx`
Expected: PASS (existing tests + the new one). Fix mock-fetch wiring until green.

- [ ] **Step 4: Commit**

```bash
git add src/components/modals/AddBookWizard.tsx __tests__/components/AddBookWizard.test.tsx
git commit -m "feat(wizard): show tracking feedback toast and default isReread for re-reads"
```

---

## Task 7: Full verification

**Files:** none (verification only)

- [ ] **Step 1: Lint**

Run: `npm run lint`
Expected: PASS with no errors (fix any new warnings/errors in the changed files; pre-existing errors must also be resolved per project policy before committing).

- [ ] **Step 2: Type-check**

Run: `npm run type-check`
Expected: PASS.

- [ ] **Step 3: Full test suite**

Run: `npm run test`
Expected: PASS, including the new suites. Note `jest` runs with `maxWorkers: 1` and hits the dev DB.

- [ ] **Step 4: Build**

Run: `npm run build`
Expected: PASS (`prisma generate` + Next build succeed).

- [ ] **Step 5: Final review (no commit needed if Tasks 1-6 each committed)**

Run: `git log --oneline -7 && git status`
Expected: a clean tree and one commit per task. Report the commit list. Do NOT push.

---

## Self-Review notes (author)

- **Spec coverage:** schema (Task 1), decision matrix (Task 2), find-only lookup (Task 3), route execution incl. live→terminal update / READING→TBR keep-progress / re-read not forcing isReread (Task 4), tracking-status endpoint (Task 5), wizard toast + re-read default (Task 6), verification (Task 7). All spec sections map to a task.
- **isReread:** never forced; `trackingFields.isReread = isReread || false` reflects the submitted value on every write; Task 4 test asserts a reread keeps `isReread:false` when submitted false.
- **Type consistency:** `resolveTrackingAction`/`LatestUserBook`/`TrackAction` names match between Task 2 and Task 4; `findExistingEdition` signature matches between Task 3, Task 4 (indirect), and Task 5.
- **Naming reminder:** the `BookStatus` enum value is `WANT_TO_READ` (UI "TBR" / "Want to Read").
