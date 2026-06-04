# Public "Track book" Button Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "Track book" button to the public book page (`/b/[bookId]`) that lets a visitor add the book to their own library via the existing AddBookWizard.

**Architecture:** The public page already holds a trusted internal `editionId`, so we add an `editionId` branch to `POST /api/user/books` (no HMAC signing needed for internal ids). The AddBookWizard gains an optional "edition mode" that posts `editionId` instead of a signed search result. A new client `TrackBookButton` (rendered inside the already-client `BookPageClient`) gates on `useSession()`: logged-out → sign-in with a return URL; logged-in → opens the wizard.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Prisma, NextAuth v5 (`next-auth/react`), Jest + React Testing Library.

---

## File Structure

- **Modify** `src/app/api/user/books/route.ts` — add `editionId` branch to `POST` (resolve edition by id, skip signature/find-or-create, reuse the existing duplicate-check + UserBook create + `recomputeBookStats`).
- **Modify** `src/components/modals/AddBookWizard.tsx` — optional edition-mode props (`editionId`, `editionDisplay`), branch the submit body, surface the API error.
- **Create** `src/components/book/TrackBookButton.tsx` — client component: session gating, sign-in redirect with return URL, auto-open after sign-in, opens wizard in edition mode.
- **Modify** `src/components/book/BookPageClient.tsx` — render `TrackBookButton` in the book-info header.
- **Create** `__tests__/api/user-books-track-by-edition.test.ts` — API branch tests.
- **Create** `__tests__/components/TrackBookButton.test.tsx` — button behavior tests.
- **Create** `__tests__/components/AddBookWizard-edition-mode.test.tsx` — wizard edition-mode submit + error surfacing.

---

## Task 1: API — add `editionId` branch to `POST /api/user/books`

**Files:**
- Modify: `src/app/api/user/books/route.ts`
- Test: `__tests__/api/user-books-track-by-edition.test.ts`

- [ ] **Step 1: Write the failing test**

Create `__tests__/api/user-books-track-by-edition.test.ts`:

```ts
/**
 * @jest-environment node
 */
import { PrismaClient } from '@prisma/client'
import { nanoid } from 'nanoid'

const prisma = new PrismaClient()

jest.mock('@/lib/auth-helpers', () => ({
  getCurrentUser: jest.fn(),
}))

import { getCurrentUser } from '@/lib/auth-helpers'
import { POST } from '@/app/api/user/books/route'
import { NextRequest } from 'next/server'

const mockGetCurrentUser = getCurrentUser as jest.MockedFunction<typeof getCurrentUser>

function postRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/user/books', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/user/books — editionId branch', () => {
  let userId: string
  let bookId: string
  let editionId: string

  beforeAll(async () => {
    const user = await prisma.user.create({ data: { email: `track-${nanoid(6)}@test.com` } })
    userId = user.id
    const book = await prisma.book.create({ data: { title: `Track-${nanoid(6)}`, authors: ['A'] } })
    bookId = book.id
    const edition = await prisma.edition.create({ data: { bookId, isbn13: `978${nanoid(10)}` } })
    editionId = edition.id
  })

  afterEach(async () => {
    await prisma.userBook.deleteMany({ where: { userId } })
    jest.clearAllMocks()
  })

  afterAll(async () => {
    await prisma.edition.deleteMany({ where: { bookId } })
    await prisma.book.deleteMany({ where: { id: bookId } })
    await prisma.user.deleteMany({ where: { id: userId } })
    await prisma.$disconnect()
  })

  it('adds an existing edition to the user library', async () => {
    mockGetCurrentUser.mockResolvedValue({ id: userId } as Awaited<ReturnType<typeof getCurrentUser>>)
    const res = await POST(postRequest({ editionId, status: 'WANT_TO_READ', format: ['EBOOK'] }))
    expect(res.status).toBe(200)
    const created = await prisma.userBook.findUnique({
      where: { userId_editionId: { userId, editionId } },
    })
    expect(created).not.toBeNull()
    expect(created?.status).toBe('WANT_TO_READ')
  })

  it('returns 400 when the edition is already in the library', async () => {
    mockGetCurrentUser.mockResolvedValue({ id: userId } as Awaited<ReturnType<typeof getCurrentUser>>)
    await prisma.userBook.create({ data: { userId, editionId, status: 'WANT_TO_READ', format: ['EBOOK'] } })
    const res = await POST(postRequest({ editionId, status: 'WANT_TO_READ', format: ['EBOOK'] }))
    expect(res.status).toBe(400)
  })

  it('returns 404 for an unknown edition id', async () => {
    mockGetCurrentUser.mockResolvedValue({ id: userId } as Awaited<ReturnType<typeof getCurrentUser>>)
    const res = await POST(postRequest({ editionId: 'does-not-exist', status: 'WANT_TO_READ', format: ['EBOOK'] }))
    expect(res.status).toBe(404)
  })

  it('returns 401 when not authenticated', async () => {
    mockGetCurrentUser.mockResolvedValue(null)
    const res = await POST(postRequest({ editionId, status: 'WANT_TO_READ', format: ['EBOOK'] }))
    expect(res.status).toBe(401)
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run test -- __tests__/api/user-books-track-by-edition.test.ts`
Expected: FAIL — the editionId path currently returns 400 ("Signed result is required") instead of 200/404.

- [ ] **Step 3: Add `editionId` to the request body destructure + type**

In `src/app/api/user/books/route.ts`, change the destructure block. Find:

```ts
    const {
      signedResult,
      status,
      format,
```
and add `editionId` right after `signedResult`:
```ts
    const {
      signedResult,
      editionId,
      status,
      format,
```

Then in the `as { ... }` type annotation, find:
```ts
    } as {
      signedResult: SignedBookSearchResult
      status: BookStatus
```
and add `editionId`:
```ts
    } as {
      signedResult?: SignedBookSearchResult
      editionId?: string
      status: BookStatus
```

- [ ] **Step 4: Replace the signed-result-required + signature + find-or-create block with a branch**

Find this exact block:

```ts
    // Validate signed result is provided
    if (!signedResult) {
      return NextResponse.json(
        { error: 'Signed result is required' },
        { status: 400 }
      )
    }

    // Verify signature before processing
    if (!verifySignature(signedResult)) {
      return NextResponse.json(
        { error: 'Invalid signature - book data may have been tampered with' },
        { status: 400 }
      )
    }
```

Replace it with:

```ts
    // Require exactly one source: an internal editionId (public page) or a
    // signed search result (search-driven add flow).
    if (!signedResult && !editionId) {
      return NextResponse.json(
        { error: 'Either editionId or signedResult is required' },
        { status: 400 }
      )
    }
```

Then find this block (the find-or-create section):

```ts
    // Extract book data from the verified signed result
    const bookData = signedResult

    // Find or create book (now with book type detection)
    const book = await findOrCreateBook(
      bookData.title,
      bookData.authors,
      'en', // Default to English, can be enhanced later
      bookData.categories // Pass categories for book type detection
    )

    // Find or create edition using the verified signed result data
    const edition = await findOrCreateEditionFromSignedResult(book.id, signedResult)
```

Replace it with:

```ts
    // Resolve the edition: look up an existing one by id, or verify + create
    // from the signed search result.
    let edition: { id: string; bookId: string }

    if (editionId) {
      const existingEdition = await prisma.edition.findUnique({
        where: { id: editionId },
        select: { id: true, bookId: true },
      })
      if (!existingEdition) {
        return NextResponse.json(
          { error: 'Edition not found' },
          { status: 404 }
        )
      }
      edition = existingEdition
    } else {
      // signedResult is guaranteed present here by the check above.
      if (!verifySignature(signedResult!)) {
        return NextResponse.json(
          { error: 'Invalid signature - book data may have been tampered with' },
          { status: 400 }
        )
      }
      const book = await findOrCreateBook(
        signedResult!.title,
        signedResult!.authors,
        'en', // Default to English, can be enhanced later
        signedResult!.categories // Pass categories for book type detection
      )
      edition = await findOrCreateEditionFromSignedResult(book.id, signedResult!)
    }
```

The remaining code (duplicate check, book-club/readathon upserts, `UserBook` create with `editionId: edition.id`, and `recomputeBookStats(edition.bookId, tx)`) is unchanged — it already reads `edition.id` and `edition.bookId`.

- [ ] **Step 5: Run the test to verify it passes**

Run: `npm run test -- __tests__/api/user-books-track-by-edition.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 6: Run lint + typecheck on the touched file**

Run: `npm run lint`
Expected: no new errors. (`npx tsc --noEmit` if you want an isolated typecheck.)

- [ ] **Step 7: Commit**

```bash
git add src/app/api/user/books/route.ts __tests__/api/user-books-track-by-edition.test.ts
git commit -m "feat(api): allow adding an existing edition to the library by editionId"
```

---

## Task 2: AddBookWizard — edition mode + error surfacing

**Files:**
- Modify: `src/components/modals/AddBookWizard.tsx`
- Test: `__tests__/components/AddBookWizard-edition-mode.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `__tests__/components/AddBookWizard-edition-mode.test.tsx`:

```tsx
import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import AddBookWizard from '@/components/modals/AddBookWizard'

jest.mock('next/image', () => ({
  __esModule: true,
  // eslint-disable-next-line jsx-a11y/alt-text, @next/next/no-img-element
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => <img {...props} />,
}))

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), refresh: jest.fn() }),
}))

describe('AddBookWizard edition mode', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('submits editionId (not signedResult) when in edition mode', async () => {
    const fetchMock = jest.fn((url: string) => {
      if (url === '/api/user/books') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ userBook: {} }) })
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) })
    })
    global.fetch = fetchMock as unknown as typeof fetch

    const onComplete = jest.fn()
    render(
      <AddBookWizard
        isOpen
        onClose={jest.fn()}
        book={null}
        editionId="ed-123"
        editionDisplay={{ title: 'Edition Title', authors: ['Author One'], imageUrl: null }}
        onComplete={onComplete}
      />
    )

    // Defaults to WANT_TO_READ; advance to the final step and submit.
    expect(screen.getByText('Edition Title')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /add to library/i }))

    await waitFor(() => expect(onComplete).toHaveBeenCalled())

    const postCall = fetchMock.mock.calls.find(([url]) => url === '/api/user/books')
    expect(postCall).toBeDefined()
    const body = JSON.parse((postCall![1] as RequestInit).body as string)
    expect(body.editionId).toBe('ed-123')
    expect(body.signedResult).toBeUndefined()
  })

  it('surfaces the API error message on failure', async () => {
    const fetchMock = jest.fn((url: string) => {
      if (url === '/api/user/books') {
        return Promise.resolve({ ok: false, json: () => Promise.resolve({ error: 'Book already in library' }) })
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) })
    })
    global.fetch = fetchMock as unknown as typeof fetch

    render(
      <AddBookWizard
        isOpen
        onClose={jest.fn()}
        book={null}
        editionId="ed-123"
        editionDisplay={{ title: 'Edition Title', authors: ['Author One'], imageUrl: null }}
        onComplete={jest.fn()}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /add to library/i }))

    await waitFor(() => expect(screen.getByText('Book already in library')).toBeInTheDocument())
  })
})
```

> Note: the "Add to Library" submit button is the final-step action. For a `WANT_TO_READ` book there is a single step, so the submit button is present immediately. If the wizard requires advancing steps for this status, add `fireEvent.click(screen.getByRole('button', { name: /next/i }))` until the submit button appears (check the rendered step buttons).

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run test -- __tests__/components/AddBookWizard-edition-mode.test.tsx`
Expected: FAIL — `editionId`/`editionDisplay` props don't exist yet, body posts `signedResult`, and there is no error display.

- [ ] **Step 3: Add edition-mode props to the interface**

Find:

```ts
interface AddBookWizardProps {
  isOpen: boolean
  onClose: () => void
  book: SignedBookSearchResult | null
  onComplete: () => void
}
```

Replace with:

```ts
interface AddBookWizardProps {
  isOpen: boolean
  onClose: () => void
  book: SignedBookSearchResult | null
  onComplete: () => void
  // Edition mode: track an existing edition (e.g. from the public book page).
  editionId?: string
  editionDisplay?: { title: string; authors: string[]; imageUrl?: string | null }
}
```

- [ ] **Step 4: Accept the new props and add an error state**

Find:

```ts
export default function AddBookWizard({ isOpen, onClose, book, onComplete }: AddBookWizardProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
```

Replace with:

```ts
export default function AddBookWizard({ isOpen, onClose, book, onComplete, editionId, editionDisplay }: AddBookWizardProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
```

- [ ] **Step 5: Branch the submit body and surface the error**

Find:

```ts
        body: JSON.stringify({
          signedResult: book,
          status: actualStatus,
```

Replace with:

```ts
        body: JSON.stringify({
          ...(editionId ? { editionId } : { signedResult: book }),
          status: actualStatus,
```

Then find:

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

Replace with:

```ts
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        setSubmitError(data.error || 'Failed to add book')
        return
      }

      onComplete()
      handleClose()
    } catch (error) {
      console.error('Error adding book:', error)
      setSubmitError('Failed to add book')
    } finally {
      setIsSubmitting(false)
    }
```

Also clear the error at the start of the submit handler. Find the start of the submit function body (the line that sets submitting true):

```ts
    setIsSubmitting(true)
```

Replace with:

```ts
    setIsSubmitting(true)
    setSubmitError(null)
```

- [ ] **Step 6: Derive display data from either source and guard render**

Find:

```ts
  if (!book) return null
```

Replace with:

```ts
  const display = editionId && editionDisplay
    ? editionDisplay
    : book
      ? { title: book.title, authors: book.authors, imageUrl: book.imageUrl }
      : null

  if (!display) return null
```

Then update the three display usages in the "Book Info" block. Find:

```tsx
                  {book.imageUrl && (
                    <Image
                      src={book.imageUrl}
                      alt={book.title}
                      width={40}
                      height={60}
                      className="rounded"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-card-foreground truncate">
                      {book.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {book.authors.join(', ')}
                    </p>
                  </div>
```

Replace with:

```tsx
                  {display.imageUrl && (
                    <Image
                      src={display.imageUrl}
                      alt={display.title}
                      width={40}
                      height={60}
                      className="rounded"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-card-foreground truncate">
                      {display.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {display.authors.join(', ')}
                    </p>
                  </div>
```

- [ ] **Step 7: Render the error message**

Immediately after the closing `</div>` of the "Book Info" block (the `mb-4 pb-4 border-b border-border` container), add an error banner:

```tsx
                {submitError && (
                  <div className="mb-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
                    {submitError}
                  </div>
                )}
```

- [ ] **Step 8: Run the test to verify it passes**

Run: `npm run test -- __tests__/components/AddBookWizard-edition-mode.test.tsx`
Expected: PASS (2 tests). If the submit button is not present on step 1 for `WANT_TO_READ`, adjust the test per the note in Step 1 by clicking "Next" until "Add to Library" appears.

- [ ] **Step 9: Run the existing wizard test to confirm no regression**

Run: `npm run test -- __tests__/components/AddBookWizard.test.tsx`
Expected: PASS (existing behavior preserved — new props are optional).

- [ ] **Step 10: Commit**

```bash
git add src/components/modals/AddBookWizard.tsx __tests__/components/AddBookWizard-edition-mode.test.tsx
git commit -m "feat(wizard): add edition mode and surface submit errors"
```

---

## Task 3: TrackBookButton component

**Files:**
- Create: `src/components/book/TrackBookButton.tsx`
- Test: `__tests__/components/TrackBookButton.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `__tests__/components/TrackBookButton.test.tsx`:

```tsx
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import TrackBookButton from '@/components/book/TrackBookButton'

const pushMock = jest.fn()
const replaceMock = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock, replace: replaceMock, refresh: jest.fn() }),
}))

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
}))

// Stub the wizard so we only assert open/closed state.
jest.mock('@/components/modals/AddBookWizard', () => ({
  __esModule: true,
  default: ({ isOpen }: { isOpen: boolean }) => (isOpen ? <div data-testid="wizard-open" /> : null),
}))

import { useSession } from 'next-auth/react'
const mockUseSession = useSession as jest.Mock

const props = {
  bookId: 'book-1',
  editionId: 'ed-1',
  title: 'A Book',
  authors: ['An Author'],
  imageUrl: null,
}

describe('TrackBookButton', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    window.history.replaceState(null, '', '/b/book-1')
  })

  it('redirects logged-out users to sign-in with a return URL', () => {
    mockUseSession.mockReturnValue({ data: null, status: 'unauthenticated' })
    render(<TrackBookButton {...props} />)
    fireEvent.click(screen.getByRole('button', { name: /track book/i }))
    expect(pushMock).toHaveBeenCalledWith(
      `/auth/signin?callbackUrl=${encodeURIComponent('/b/book-1?track=1')}`
    )
    expect(screen.queryByTestId('wizard-open')).not.toBeInTheDocument()
  })

  it('opens the wizard for logged-in users', () => {
    mockUseSession.mockReturnValue({ data: { user: { id: 'u1' } }, status: 'authenticated' })
    render(<TrackBookButton {...props} />)
    fireEvent.click(screen.getByRole('button', { name: /track book/i }))
    expect(screen.getByTestId('wizard-open')).toBeInTheDocument()
    expect(pushMock).not.toHaveBeenCalled()
  })

  it('auto-opens the wizard when authenticated and ?track=1 is present', () => {
    window.history.replaceState(null, '', '/b/book-1?track=1')
    mockUseSession.mockReturnValue({ data: { user: { id: 'u1' } }, status: 'authenticated' })
    render(<TrackBookButton {...props} />)
    expect(screen.getByTestId('wizard-open')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run test -- __tests__/components/TrackBookButton.test.tsx`
Expected: FAIL — module `@/components/book/TrackBookButton` does not exist.

- [ ] **Step 3: Create the component**

Create `src/components/book/TrackBookButton.tsx`:

```tsx
'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import AddBookWizard from '@/components/modals/AddBookWizard'

interface TrackBookButtonProps {
  bookId: string
  editionId: string
  title: string
  authors: string[]
  imageUrl?: string | null
}

export default function TrackBookButton({
  bookId,
  editionId,
  title,
  authors,
  imageUrl,
}: TrackBookButtonProps) {
  const { status } = useSession()
  const router = useRouter()
  const [isWizardOpen, setIsWizardOpen] = useState(false)
  const [added, setAdded] = useState(false)

  // After returning from sign-in (?track=1), open the wizard and strip the param.
  useEffect(() => {
    if (status !== 'authenticated') return
    const params = new URLSearchParams(window.location.search)
    if (params.get('track') === '1') {
      setIsWizardOpen(true)
      params.delete('track')
      const qs = params.toString()
      window.history.replaceState(null, '', `/b/${bookId}${qs ? `?${qs}` : ''}`)
    }
  }, [status, bookId])

  const handleClick = () => {
    if (status === 'authenticated') {
      setIsWizardOpen(true)
      return
    }
    const callbackUrl = `/b/${bookId}?track=1`
    router.push(`/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`)
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={added}
        className="inline-flex items-center justify-center rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:cursor-default disabled:opacity-70 focus-ring"
      >
        {added ? 'Added to your library' : 'Track book'}
      </button>

      <AddBookWizard
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        book={null}
        editionId={editionId}
        editionDisplay={{ title, authors, imageUrl }}
        onComplete={() => {
          setAdded(true)
          setIsWizardOpen(false)
        }}
      />
    </>
  )
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm run test -- __tests__/components/TrackBookButton.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/book/TrackBookButton.tsx __tests__/components/TrackBookButton.test.tsx
git commit -m "feat(book): add TrackBookButton with session gating and sign-in return"
```

---

## Task 4: Wire TrackBookButton into BookPageClient

**Files:**
- Modify: `src/components/book/BookPageClient.tsx`
- Test: `__tests__/components/book/BookPageClient-track.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `__tests__/components/book/BookPageClient-track.test.tsx`:

```tsx
import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import BookPageClient from '@/components/book/BookPageClient'
import type { BookPageData } from '@/types/book-page'

jest.mock('next/image', () => ({
  __esModule: true,
  // eslint-disable-next-line jsx-a11y/alt-text, @next/next/no-img-element
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => <img {...props} />,
}))

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>,
}))

// Stub the button so we only assert it is wired with the edition id.
jest.mock('@/components/book/TrackBookButton', () => ({
  __esModule: true,
  default: ({ editionId, bookId }: { editionId: string; bookId: string }) => (
    <div data-testid="track-button" data-edition={editionId} data-book={bookId} />
  ),
}))

const data: BookPageData = {
  book: { id: 'book-1', title: 'The Book', authors: ['Author A'], bookType: 'FICTION' },
  edition: {
    id: 'ed-1',
    title: null,
    defaultCoverProvider: null,
    googleBook: null,
    hardcoverBook: null,
    ibdbBook: null,
  },
  aggregatedRating: null,
  publicReviews: [],
  reviewsCapped: false,
  totalRatingCount: 0,
}

describe('BookPageClient — track button', () => {
  it('renders TrackBookButton wired to the edition and book ids', () => {
    render(<BookPageClient data={data} />)
    const button = screen.getByTestId('track-button')
    expect(button).toHaveAttribute('data-edition', 'ed-1')
    expect(button).toHaveAttribute('data-book', 'book-1')
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run test -- __tests__/components/book/BookPageClient-track.test.tsx`
Expected: FAIL — `TrackBookButton` is not rendered yet, so `getByTestId('track-button')` throws.

- [ ] **Step 3: Import and render TrackBookButton**

In `src/components/book/BookPageClient.tsx`, add the import near the other component imports (after the `BookPageData` import line):

```tsx
import TrackBookButton from '@/components/book/TrackBookButton';
```

Then render the button in the info column. Find the authors paragraph closing tag followed by the aggregated rating block:

```tsx
              </p>

              {aggregatedRating && (
```

Replace with:

```tsx
              </p>

              <div className="mb-4">
                <TrackBookButton
                  bookId={book.id}
                  editionId={edition.id}
                  title={displayTitle}
                  authors={book.authors}
                  imageUrl={imageUrl}
                />
              </div>

              {aggregatedRating && (
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm run test -- __tests__/components/book/BookPageClient-track.test.tsx`
Expected: PASS (1 test).

- [ ] **Step 5: Commit**

```bash
git add src/components/book/BookPageClient.tsx __tests__/components/book/BookPageClient-track.test.tsx
git commit -m "feat(book): render Track book button on the public book page"
```

---

## Task 5: Full verification

**Files:** none (verification only)

- [ ] **Step 1: Lint**

Run: `npm run lint`
Expected: no errors (root + video-gen cascade).

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Full test suite**

Run: `npm run test`
Expected: all tests pass.

- [ ] **Step 4: Build**

Run: `npm run build`
Expected: build succeeds (no Suspense/`useSearchParams` errors — the button reads `window.location` in an effect, so the page stays ISR-cacheable).

- [ ] **Step 5: Manual smoke check (optional but recommended)**

Run: `npm run dev`, open a public book page (`/b/<bookId>`):
- Logged out: "Track book" → redirected to sign-in; after auth, returns to the page with the wizard auto-opening.
- Logged in: "Track book" → wizard opens; completing it adds the book; re-tracking the same book shows "Book already in library".

---

## Notes on coverage vs. spec

- Spec §"API" → Task 1 (editionId branch, 401/404/400-duplicate).
- Spec §"AddBookWizard" → Task 2 (edition mode, error surfacing).
- Spec §"TrackBookButton" → Task 3 (session gating, sign-in return, auto-open).
- Spec §"BookPageClient wiring" → Task 4.
- Spec §"Caching" → Task 5 Step 4 verifies the page still builds as ISR (no `useSearchParams` Suspense requirement, since auto-open reads `window.location`).
- Spec §"Testing" → Tasks 1–4 each ship their tests; Task 5 runs the full gate (lint + typecheck + test + build) required before any commit per project rules.
