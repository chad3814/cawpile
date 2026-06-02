# Edit Book Dates Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let users edit the dates they started, finished, or DNF'd a book via the existing Edit Book modal, with start/finish date validation.

**Architecture:** Extend `EditBookModal`'s Basic Info tab with a two-column "Started / Finished" date row whose enabled state and right-column label are driven by reading status. Disabled dates are cleared on save. A shared pure helper validates dates (finish ≥ start, no future) on both client and server; the PATCH route is hardened to treat `null` as an explicit clear instead of corrupting data into the Unix epoch.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Prisma, Jest + React Testing Library.

---

## Project-specific notes

- **Commits require explicit approval from Chad, every time.** Never commit or push without it.
- **A commit is only allowed when `npm run lint`, type-check (via `npm run build`), `npm run test`, and `npm run build` all pass** — including any pre-existing failures. Run these before requesting commit approval at the end of each task.
- Date inputs use `yyyy-mm-dd` strings. The PATCH route parses them with `new Date(str)` (UTC midnight). `validateBookDates` compares the `yyyy-mm-dd` strings lexically, which is correct for ISO date ordering.
- 2-space indent, always semicolons, no `any`/`unknown`.

## File Structure

- **Create** `src/lib/validateBookDates.ts` — pure date-validation helper (one responsibility: validate a start/finish pair). Used by both the modal and the API route.
- **Create** `__tests__/lib/validateBookDates.test.ts` — unit tests for the helper.
- **Modify** `src/app/api/user/books/[id]/route.ts` — null-safe `startDate`/`finishDate` handling + server-side validation.
- **Modify** `__tests__/api/user-books-dnf-patch.test.ts` — add date-validation and null-clearing cases.
- **Modify** `src/components/modals/EditBookModal.tsx` — add `startDate` prop, two-column date row, disable/label logic, clear-on-disable submit logic, client validation, default-today effect.
- **Modify** `__tests__/components/EditBookModal.test.tsx` — update two existing DNF tests for the new markup; add per-status disable/label, validation, and clearing tests.
- **Modify** `src/components/dashboard/BookCard.tsx` — pass `startDate` into `EditBookModal`.

---

## Task 1: Shared date-validation helper

**Files:**
- Create: `src/lib/validateBookDates.ts`
- Test: `__tests__/lib/validateBookDates.test.ts`

- [ ] **Step 1: Write the failing test**

Create `__tests__/lib/validateBookDates.test.ts`:

```typescript
import { validateBookDates } from '@/lib/validateBookDates';

describe('validateBookDates', () => {
  const today = '2026-06-02';

  test('returns null when both dates are absent', () => {
    expect(validateBookDates({ today })).toBeNull();
  });

  test('returns null for a valid start/finish pair', () => {
    expect(
      validateBookDates({ startDate: '2026-01-01', finishDate: '2026-02-01', today })
    ).toBeNull();
  });

  test('allows finish equal to start', () => {
    expect(
      validateBookDates({ startDate: '2026-01-01', finishDate: '2026-01-01', today })
    ).toBeNull();
  });

  test('rejects finish before start', () => {
    expect(
      validateBookDates({ startDate: '2026-02-01', finishDate: '2026-01-01', today })
    ).toBe('Finish date cannot be before the start date');
  });

  test('rejects a future start date', () => {
    expect(validateBookDates({ startDate: '2026-06-03', today })).toBe(
      'Start date cannot be in the future'
    );
  });

  test('rejects a future finish date', () => {
    expect(validateBookDates({ finishDate: '2026-06-03', today })).toBe(
      'Finish date cannot be in the future'
    );
  });

  test('treats null and undefined as absent', () => {
    expect(validateBookDates({ startDate: null, finishDate: null, today })).toBeNull();
  });

  test('ordering check is skipped when only one date is present', () => {
    expect(validateBookDates({ finishDate: '2026-01-01', today })).toBeNull();
    expect(validateBookDates({ startDate: '2026-01-01', today })).toBeNull();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run test -- __tests__/lib/validateBookDates.test.ts`
Expected: FAIL — `Cannot find module '@/lib/validateBookDates'`.

- [ ] **Step 3: Implement the helper**

Create `src/lib/validateBookDates.ts`:

```typescript
export interface BookDateValidationInput {
  startDate?: string | null;
  finishDate?: string | null;
  /** yyyy-mm-dd; defaults to the current UTC date. */
  today?: string;
}

/**
 * Validates a book's start/finish date pair. Dates are yyyy-mm-dd strings,
 * which compare correctly with lexical `<`/`>`. Returns an error message, or
 * null when the pair is valid. Absent (undefined/null) dates are skipped.
 */
export function validateBookDates(input: BookDateValidationInput): string | null {
  const today = input.today ?? new Date().toISOString().split('T')[0];
  const startDate = input.startDate || null;
  const finishDate = input.finishDate || null;

  if (startDate && startDate > today) {
    return 'Start date cannot be in the future';
  }
  if (finishDate && finishDate > today) {
    return 'Finish date cannot be in the future';
  }
  if (startDate && finishDate && finishDate < startDate) {
    return 'Finish date cannot be before the start date';
  }
  return null;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm run test -- __tests__/lib/validateBookDates.test.ts`
Expected: PASS (8 tests).

- [ ] **Step 5: Verify, then commit (requires Chad's approval)**

Run: `npm run lint && npm run test -- __tests__/lib/validateBookDates.test.ts && npm run build`
Expected: all succeed.

```bash
git add src/lib/validateBookDates.ts __tests__/lib/validateBookDates.test.ts
git commit -m "feat: add validateBookDates helper for start/finish date rules"
```

---

## Task 2: Server-side null handling + validation in the PATCH route

**Files:**
- Modify: `src/app/api/user/books/[id]/route.ts`
- Test: `__tests__/api/user-books-dnf-patch.test.ts`

- [ ] **Step 1: Write the failing tests**

Append these tests inside the existing `describe('PATCH /api/user/books/[id] - DNF Status Changes', ...)` block in `__tests__/api/user-books-dnf-patch.test.ts` (before its closing `})`):

```typescript
  test('explicit null finishDate clears the field (not epoch)', async () => {
    await prisma.userBook.update({
      where: { id: testUserBookId },
      data: { status: BookStatus.COMPLETED, finishDate: new Date('2024-05-01') },
    });

    const request = new NextRequest('http://localhost:3000/api/user/books/test', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'READING', finishDate: null }),
      headers: { 'Content-Type': 'application/json' },
    });
    const params = Promise.resolve({ id: testUserBookId });

    const response = await PATCH(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.userBook.finishDate).toBeNull();
  });

  test('explicit null startDate and finishDate clear both fields', async () => {
    await prisma.userBook.update({
      where: { id: testUserBookId },
      data: {
        status: BookStatus.COMPLETED,
        startDate: new Date('2024-04-01'),
        finishDate: new Date('2024-05-01'),
      },
    });

    const request = new NextRequest('http://localhost:3000/api/user/books/test', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'WANT_TO_READ', startDate: null, finishDate: null }),
      headers: { 'Content-Type': 'application/json' },
    });
    const params = Promise.resolve({ id: testUserBookId });

    const response = await PATCH(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.userBook.startDate).toBeNull();
    expect(data.userBook.finishDate).toBeNull();
  });

  test('rejects finish date before start date with 400', async () => {
    const request = new NextRequest('http://localhost:3000/api/user/books/test', {
      method: 'PATCH',
      body: JSON.stringify({ startDate: '2024-03-01', finishDate: '2024-02-01' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const params = Promise.resolve({ id: testUserBookId });

    const response = await PATCH(request, { params });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Finish date cannot be before the start date');
  });

  test('rejects a future finish date with 400', async () => {
    const future = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];

    const request = new NextRequest('http://localhost:3000/api/user/books/test', {
      method: 'PATCH',
      body: JSON.stringify({ finishDate: future }),
      headers: { 'Content-Type': 'application/json' },
    });
    const params = Promise.resolve({ id: testUserBookId });

    const response = await PATCH(request, { params });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Finish date cannot be in the future');
  });

  test('validates finish against the existing start date when start is not in the body', async () => {
    await prisma.userBook.update({
      where: { id: testUserBookId },
      data: { startDate: new Date('2024-05-01') },
    });

    const request = new NextRequest('http://localhost:3000/api/user/books/test', {
      method: 'PATCH',
      body: JSON.stringify({ finishDate: '2024-04-01' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const params = Promise.resolve({ id: testUserBookId });

    const response = await PATCH(request, { params });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Finish date cannot be before the start date');
  });
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm run test -- __tests__/api/user-books-dnf-patch.test.ts`
Expected: FAIL — null cases hit `new Date(null)` (stores 1970, not null), and the 400 cases return 200 (no validation yet).

- [ ] **Step 3: Add the import**

In `src/app/api/user/books/[id]/route.ts`, add to the imports at the top (after the existing `calculateCawpileAverage` import on line 5):

```typescript
import { validateBookDates } from '@/lib/validateBookDates'
```

- [ ] **Step 4: Make date assignment null-safe**

In `src/app/api/user/books/[id]/route.ts`, replace these two lines (currently ~135–136):

```typescript
    if (startDate !== undefined) updateData.startDate = new Date(startDate)
    if (finishDate !== undefined) updateData.finishDate = new Date(finishDate)
```

with:

```typescript
    if (startDate !== undefined) updateData.startDate = startDate === null ? null : new Date(startDate)
    if (finishDate !== undefined) updateData.finishDate = finishDate === null ? null : new Date(finishDate)
```

- [ ] **Step 5: Add server-side validation**

In the same file, immediately after the `if (!userBook) { ... }` not-found block (currently ends ~line 118, before `// Prepare update data`), insert:

```typescript
    // Validate start/finish dates against each other and the current date.
    // Fall back to the stored value for whichever date is not in this request.
    const toIso = (d: Date | null): string | null => (d ? d.toISOString().split('T')[0] : null)
    const effectiveStart = startDate !== undefined ? startDate : toIso(userBook.startDate)
    const effectiveFinish = finishDate !== undefined ? finishDate : toIso(userBook.finishDate)
    const dateError = validateBookDates({ startDate: effectiveStart, finishDate: effectiveFinish })
    if (dateError) {
      return NextResponse.json({ error: dateError }, { status: 400 })
    }
```

- [ ] **Step 6: Run the tests to verify they pass**

Run: `npm run test -- __tests__/api/user-books-dnf-patch.test.ts`
Expected: PASS — all existing DNF tests plus the 5 new ones.

- [ ] **Step 7: Verify, then commit (requires Chad's approval)**

Run: `npm run lint && npm run test -- __tests__/api/user-books-dnf-patch.test.ts && npm run build`
Expected: all succeed.

```bash
git add src/app/api/user/books/\[id\]/route.ts __tests__/api/user-books-dnf-patch.test.ts
git commit -m "feat: validate book dates and null-clear them in the PATCH route"
```

---

## Task 3: EditBookModal date row + client validation + BookCard wiring

**Files:**
- Modify: `src/components/modals/EditBookModal.tsx`
- Modify: `src/components/dashboard/BookCard.tsx`
- Test: `__tests__/components/EditBookModal.test.tsx`

- [ ] **Step 1: Update existing tests and add new ones**

Replace the entire body of `__tests__/components/EditBookModal.test.tsx` with the following (updates the two existing DNF tests for the new markup and adds per-status, validation, and clearing tests):

```typescript
/**
 * Tests for EditBookModal start/finish/DNF date editing
 */
import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import '@testing-library/jest-dom'
import EditBookModal from '@/components/modals/EditBookModal'

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    refresh: jest.fn(),
  }),
}))

global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve([]),
  })
) as jest.Mock

const getBody = (mockFetch: jest.Mock) => {
  const patchCall = mockFetch.mock.calls.find((call: [string, RequestInit]) =>
    call[0].includes('/api/user/books/')
  )
  return patchCall ? JSON.parse(patchCall[1].body as string) : null
}

describe('EditBookModal date editing', () => {
  const mockOnClose = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2024-03-20'))
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  const renderModal = async (book: React.ComponentProps<typeof EditBookModal>['book']) => {
    await act(async () => {
      render(<EditBookModal isOpen={true} onClose={mockOnClose} book={book} />)
    })
  }

  test('start enabled and finish disabled for Reading status', async () => {
    await renderModal({
      id: 'b1',
      title: 'Test',
      status: 'READING',
      format: ['PAPERBACK'],
      startDate: new Date('2024-03-01'),
    })

    const start = document.querySelector('#start-date') as HTMLInputElement
    const finish = document.querySelector('#finish-date') as HTMLInputElement
    expect(start).not.toBeDisabled()
    expect(start).toHaveValue('2024-03-01')
    expect(finish).toBeDisabled()
    expect(screen.getByText('Finished')).toBeInTheDocument()
  })

  test('both dates disabled for Want to Read status', async () => {
    await renderModal({
      id: 'b1',
      title: 'Test',
      status: 'WANT_TO_READ',
      format: ['PAPERBACK'],
    })

    expect(document.querySelector('#start-date')).toBeDisabled()
    expect(document.querySelector('#finish-date')).toBeDisabled()
  })

  test('finish field labeled "Finished" and enabled for Completed status', async () => {
    await renderModal({
      id: 'b1',
      title: 'Test',
      status: 'COMPLETED',
      format: ['PAPERBACK'],
      startDate: new Date('2024-02-01'),
      finishDate: new Date('2024-03-01'),
    })

    const finish = document.querySelector('#finish-date') as HTMLInputElement
    expect(finish).not.toBeDisabled()
    expect(finish).toHaveValue('2024-03-01')
    expect(screen.getByText('Finished')).toBeInTheDocument()
  })

  test('finish field labeled "Stopped reading" for DNF status', async () => {
    await renderModal({
      id: 'b1',
      title: 'Test',
      status: 'DNF',
      format: ['PAPERBACK'],
      finishDate: new Date('2024-02-15'),
      dnfReason: 'Too slow',
    })

    expect(screen.getByText('Stopped reading')).toBeInTheDocument()
    const finish = document.querySelector('#finish-date') as HTMLInputElement
    expect(finish).toHaveValue('2024-02-15')
  })

  test('editing start and finish on a Completed book sends both dates', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ userBook: { id: 'b1' } }),
    })
    global.fetch = mockFetch

    await renderModal({
      id: 'b1',
      title: 'Test',
      status: 'COMPLETED',
      format: ['PAPERBACK'],
      startDate: new Date('2024-02-01'),
      finishDate: new Date('2024-03-01'),
    })

    await act(async () => {
      fireEvent.change(document.querySelector('#start-date') as HTMLInputElement, {
        target: { value: '2024-02-05' },
      })
      fireEvent.change(document.querySelector('#finish-date') as HTMLInputElement, {
        target: { value: '2024-03-10' },
      })
    })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Save Changes/i }))
    })

    await waitFor(() => expect(mockFetch).toHaveBeenCalled())
    const body = getBody(mockFetch)
    expect(body.startDate).toBe('2024-02-05')
    expect(body.finishDate).toBe('2024-03-10')
  })

  test('shows an error and does not submit when finish is before start', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ userBook: { id: 'b1' } }),
    })
    global.fetch = mockFetch

    await renderModal({
      id: 'b1',
      title: 'Test',
      status: 'COMPLETED',
      format: ['PAPERBACK'],
      startDate: new Date('2024-03-01'),
      finishDate: new Date('2024-03-01'),
    })

    await act(async () => {
      fireEvent.change(document.querySelector('#finish-date') as HTMLInputElement, {
        target: { value: '2024-02-01' },
      })
    })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Save Changes/i }))
    })

    expect(screen.getByText('Finish date cannot be before the start date')).toBeInTheDocument()
    expect(mockFetch).not.toHaveBeenCalled()
  })

  test('switching Completed to Reading sends finishDate null', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ userBook: { id: 'b1' } }),
    })
    global.fetch = mockFetch

    await renderModal({
      id: 'b1',
      title: 'Test',
      status: 'COMPLETED',
      format: ['PAPERBACK'],
      startDate: new Date('2024-02-01'),
      finishDate: new Date('2024-03-01'),
    })

    await act(async () => {
      fireEvent.change(screen.getByLabelText('Reading Status'), {
        target: { value: 'READING' },
      })
    })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Save Changes/i }))
    })

    await waitFor(() => expect(mockFetch).toHaveBeenCalled())
    const body = getBody(mockFetch)
    expect(body.finishDate).toBeNull()
    expect(body.startDate).toBe('2024-02-01')
  })

  test('switching to Want to Read sends both dates null', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ userBook: { id: 'b1' } }),
    })
    global.fetch = mockFetch

    await renderModal({
      id: 'b1',
      title: 'Test',
      status: 'COMPLETED',
      format: ['PAPERBACK'],
      startDate: new Date('2024-02-01'),
      finishDate: new Date('2024-03-01'),
    })

    await act(async () => {
      fireEvent.change(screen.getByLabelText('Reading Status'), {
        target: { value: 'WANT_TO_READ' },
      })
    })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Save Changes/i }))
    })

    await waitFor(() => expect(mockFetch).toHaveBeenCalled())
    const body = getBody(mockFetch)
    expect(body.startDate).toBeNull()
    expect(body.finishDate).toBeNull()
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm run test -- __tests__/components/EditBookModal.test.tsx`
Expected: FAIL — no `#start-date` element, `startDate` not on the prop type, no "Reading Status" accessible label match for `getByLabelText`, etc.

- [ ] **Step 3: Add `startDate` to the modal props and import the validator**

In `src/components/modals/EditBookModal.tsx`:

Add the import after the existing `useRouter` import (line 16):

```typescript
import { validateBookDates } from '@/lib/validateBookDates'
```

In the `EditBookModalProps` `book` shape, add `startDate` next to the existing `finishDate?` field (line 42):

```typescript
    startDate?: Date | null
    finishDate?: Date | null
```

- [ ] **Step 4: Replace DNF-only date state with start/finish state**

In `src/components/modals/EditBookModal.tsx`, replace the `dnfDate` state declaration (currently ~lines 78–82):

```typescript
  const [dnfDate, setDnfDate] = useState(
    book.finishDate && book.status === BookStatus.DNF
      ? new Date(book.finishDate).toISOString().split('T')[0]
      : ''
  )
```

with:

```typescript
  const [startDate, setStartDate] = useState(
    book.startDate ? new Date(book.startDate).toISOString().split('T')[0] : ''
  )
  const [finishDate, setFinishDate] = useState(
    book.finishDate ? new Date(book.finishDate).toISOString().split('T')[0] : ''
  )
  const [dateError, setDateError] = useState<string | null>(null)
```

- [ ] **Step 5: Replace the status-change effect**

Replace the existing effect that defaults the DNF date and clears the DNF reason (currently ~lines 184–193):

```typescript
  // Clear DNF reason and set default date when status changes to DNF
  useEffect(() => {
    if (status === BookStatus.DNF && !dnfDate) {
      // Default to today's date
      setDnfDate(new Date().toISOString().split('T')[0])
    }
    if (status !== BookStatus.DNF) {
      setDnfReason('')
    }
  }, [status, dnfDate])
```

with:

```typescript
  // Default the relevant date to today when entering a status that needs it,
  // and clear the DNF reason when leaving DNF.
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]
    if (status === BookStatus.READING && !startDate) {
      setStartDate(today)
    }
    if ((status === BookStatus.COMPLETED || status === BookStatus.DNF) && !finishDate) {
      setFinishDate(today)
    }
    if (status !== BookStatus.DNF) {
      setDnfReason('')
    }
  }, [status, startDate, finishDate])
```

- [ ] **Step 6: Update the submit handler for clearing + client validation**

In `handleSubmit`, replace the `fetch` body construction (currently ~lines 253–268). Replace this:

```typescript
      const response = await fetch(`/api/user/books/${book.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status,
          format,
          dnfReason: status === BookStatus.DNF ? dnfReason : undefined,
          finishDate: status === BookStatus.DNF && dnfDate ? dnfDate : undefined,
          notes: notes || undefined,
          preferredCoverProvider,
          ...trackingData,
          ...additionalData
        }),
      })
```

with:

```typescript
      const startEnabled = status !== BookStatus.WANT_TO_READ
      const finishEnabled = status === BookStatus.COMPLETED || status === BookStatus.DNF
      const startValue = startEnabled ? (startDate || null) : null
      const finishValue = finishEnabled ? (finishDate || null) : null

      const dateValidationError = validateBookDates({
        startDate: startValue,
        finishDate: finishValue,
      })
      if (dateValidationError) {
        setDateError(dateValidationError)
        setIsSubmitting(false)
        return
      }
      setDateError(null)

      const response = await fetch(`/api/user/books/${book.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status,
          format,
          dnfReason: status === BookStatus.DNF ? dnfReason : undefined,
          startDate: startValue,
          finishDate: finishValue,
          notes: notes || undefined,
          preferredCoverProvider,
          ...trackingData,
          ...additionalData
        }),
      })
```

- [ ] **Step 7: Add the accessible label and the two-column date row**

In the Basic Info tab, add `id="status-select"` and an explicit label association is already present via `htmlFor="status"`; ensure the `<label>` text "Reading Status" is matched by `getByLabelText`. The existing markup uses `<label htmlFor="status">Reading Status</label>` and `<select id="status">`, which already associates them — no change needed there.

Replace the entire DNF-only conditional block (currently ~lines 400–434, the `{status === BookStatus.DNF && ( <> ...date + reason... </> )}` block) with this — a status-independent date row, followed by the DNF-reason field that still only shows for DNF:

```tsx
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Started
                          </label>
                          <input
                            id="start-date"
                            type="date"
                            value={startDate}
                            disabled={status === BookStatus.WANT_TO_READ}
                            onChange={(e) => setStartDate(e.target.value)}
                            max={maxDate}
                            className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                          />
                        </div>
                        <div>
                          <label htmlFor="finish-date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {status === BookStatus.DNF ? 'Stopped reading' : 'Finished'}
                          </label>
                          <input
                            id="finish-date"
                            type="date"
                            value={finishDate}
                            disabled={!(status === BookStatus.COMPLETED || status === BookStatus.DNF)}
                            onChange={(e) => setFinishDate(e.target.value)}
                            max={maxDate}
                            className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                          />
                        </div>
                      </div>

                      {dateError && (
                        <p className="text-sm text-red-600 dark:text-red-400">{dateError}</p>
                      )}

                      {status === BookStatus.DNF && (
                        <div>
                          <label htmlFor="dnf-reason" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            DNF Reason (optional)
                          </label>
                          <textarea
                            id="dnf-reason"
                            value={dnfReason}
                            onChange={(e) => setDnfReason(e.target.value)}
                            maxLength={500}
                            rows={4}
                            placeholder="Why did you not finish this book?"
                            className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                          />
                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            {dnfReason.length}/500 characters
                          </p>
                        </div>
                      )}
```

- [ ] **Step 8: Pass `startDate` from BookCard**

In `src/components/dashboard/BookCard.tsx`, in the `<EditBookModal ... book={{ ... }}>` literal (currently ~line 609), add `startDate` above the existing `finishDate` line:

```tsx
        startDate: book.startDate,
        finishDate: book.finishDate,
```

- [ ] **Step 9: Run the tests to verify they pass**

Run: `npm run test -- __tests__/components/EditBookModal.test.tsx`
Expected: PASS (8 tests).

- [ ] **Step 10: Full verification, then commit (requires Chad's approval)**

Run: `npm run lint && npm run test && npm run build`
Expected: all succeed (full suite, including video-gen cascade).

```bash
git add src/components/modals/EditBookModal.tsx src/components/dashboard/BookCard.tsx __tests__/components/EditBookModal.test.tsx
git commit -m "feat: edit start/finish dates in the Edit Book modal"
```

---

## Self-Review Notes

- **Spec coverage:** UI two-column row + disable/label matrix (Task 3 Step 7); clear-on-disable (Task 3 Step 6 + Task 2 null handling); finish≥start & no-future validation on client (Task 3 Step 6) and server (Task 2 Step 5); `new Date(null)` epoch bug fix (Task 2 Step 4); BookCard wiring (Task 3 Step 8); tests for all (Tasks 1–3).
- **Type consistency:** `validateBookDates({ startDate, finishDate, today? })` signature is identical across the helper, the route, and the modal. `startValue`/`finishValue` are `string | null`. Modal prop `startDate?: Date | null` mirrors the existing `finishDate?: Date | null`.
- **Note on DNF→Reading existing test:** `__tests__/api/user-books-dnf-patch.test.ts`'s existing "should not clear finishDate" test sends no date fields, so `finishDate` stays `undefined` and is preserved — unaffected by the null-clear path (clearing only happens when the client sends explicit `null`).
