# Books Section Rich Rows — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the cover-card grid on `/books/newest`, `/books/popular`, and `/books/top-rated` with rich horizontal list rows (cover, title, author, star rating + count, truncated description), modeled on the book-page hero.

**Architecture:** Add an opt-in "detail" mode to the ranking fetchers that additionally selects rating count/sum and an edition description; the three section pages and the load-more API use detail mode, while the `/books` landing keeps the lean shape. A new `BookListRow` client component renders the row; `BooksSectionClient` swaps its card grid for a list of these rows.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Prisma, TailwindCSS, Jest + React Testing Library.

---

## Project-specific notes

- **Commits require explicit approval from Chad, every time.** Never commit/push without it.
- **A commit is only allowed when `npm run lint`, `npm run type-check`, `npm run test`, and `npm run build` all pass** (root + `services/video-gen` cascade), including any pre-existing issues. `npm run type-check` is separate from the build and type-checks test files — always run it.
- 2-space indent, semicolons, no `any`/`unknown`.
- `@/` maps to `src/`.

## File Structure

- **Create** `src/lib/books/formatBookStat.ts` — pure formatter for a `BookStat` (extracted from `PublicBookCard`). Client-safe (type-only import of `BookStat`, no prisma).
- **Create** `__tests__/lib/books/formatBookStat.test.ts` — unit tests for the formatter.
- **Modify** `src/components/books/PublicBookCard.tsx` — use the shared `formatBookStat` (no behavior change).
- **Modify** `src/lib/db/bookRankings.ts` — add `RankedBookDetail`, a detail select + mapper, and a `detail` overload on each fetcher.
- **Modify** `__tests__/lib/db/bookRankings.test.ts` — cover detail mode.
- **Create** `src/components/books/BookListRow.tsx` — the rich row.
- **Create** `__tests__/components/books/BookListRow.test.tsx` — row tests.
- **Modify** `src/components/books/BooksSectionClient.tsx` — render a list of `BookListRow` (detail typed) instead of the card grid.
- **Modify** `__tests__/components/books/BooksSectionClient.test.tsx` — detail fixtures.
- **Modify** `src/app/books/[section]/page.tsx` and `src/app/api/books/route.ts` — fetch in detail mode.

---

## Task 1: Extract the shared `formatBookStat` formatter

**Files:**
- Create: `src/lib/books/formatBookStat.ts`
- Create: `__tests__/lib/books/formatBookStat.test.ts`
- Modify: `src/components/books/PublicBookCard.tsx`

- [ ] **Step 1: Write the failing test**

Create `__tests__/lib/books/formatBookStat.test.ts`:

```typescript
import { formatBookStat } from '@/lib/books/formatBookStat';

describe('formatBookStat', () => {
  it('formats an addedAt stat as "Added Mon YYYY" (UTC)', () => {
    expect(formatBookStat({ kind: 'addedAt', value: '2026-05-01T00:00:00Z' })).toBe('Added May 2026');
  });

  it('pluralizes readers', () => {
    expect(formatBookStat({ kind: 'readers', value: 42 })).toBe('42 readers');
    expect(formatBookStat({ kind: 'readers', value: 1 })).toBe('1 reader');
  });

  it('formats a rating to one decimal with "avg"', () => {
    expect(formatBookStat({ kind: 'rating', value: 8.37 })).toBe('8.4 avg');
  });
});
```

- [ ] **Step 2: Run it — expect failure**

Run: `npx jest __tests__/lib/books/formatBookStat.test.ts`
Expected: FAIL — `Cannot find module '@/lib/books/formatBookStat'`.

- [ ] **Step 3: Create the formatter**

Create `src/lib/books/formatBookStat.ts`:

```typescript
import type { BookStat } from '@/lib/db/bookRankings';

/**
 * Human-readable label for a book's ranking stat. Type-only import of BookStat
 * keeps this module free of the prisma import in bookRankings, so client
 * components can use it.
 */
export function formatBookStat(stat: BookStat): string {
  switch (stat.kind) {
    case 'addedAt': {
      const label = new Intl.DateTimeFormat('en-US', {
        month: 'short',
        year: 'numeric',
        timeZone: 'UTC',
      }).format(new Date(stat.value));
      return `Added ${label}`;
    }
    case 'readers':
      return `${stat.value} ${stat.value === 1 ? 'reader' : 'readers'}`;
    case 'rating':
      return `${stat.value.toFixed(1)} avg`;
    default: {
      const _exhaustive: never = stat;
      return _exhaustive;
    }
  }
}
```

- [ ] **Step 4: Run it — expect pass**

Run: `npx jest __tests__/lib/books/formatBookStat.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Use it from `PublicBookCard`**

In `src/components/books/PublicBookCard.tsx`, delete the local `formatStat` function (the `function formatStat(stat: BookStat): string { … }` block near the top) and add an import after the existing `import type { RankedBook, BookStat } from '@/lib/db/bookRankings';` line:

```typescript
import { formatBookStat } from '@/lib/books/formatBookStat';
```

Then change the single call site from:

```tsx
      <p className="mt-1 text-xs font-medium text-primary">{formatStat(book.stat)}</p>
```

to:

```tsx
      <p className="mt-1 text-xs font-medium text-primary">{formatBookStat(book.stat)}</p>
```

If `BookStat` is now unused in `PublicBookCard.tsx`, drop it from the import (`import type { RankedBook } from '@/lib/db/bookRankings';`).

- [ ] **Step 6: Verify the existing card test still passes**

Run: `npx jest __tests__/components/books/PublicBookCard.test.tsx __tests__/lib/books/formatBookStat.test.ts`
Expected: PASS (the card test's "42 readers" / "1 reader" / "8.4 avg" / "Added May 2026" assertions are unchanged).

- [ ] **Step 7: Verify gate, then commit (requires Chad's approval)**

Run: `npm run lint && npm run type-check && npm run test && npm run build`

If all pass, commit:

```bash
git add src/lib/books/formatBookStat.ts __tests__/lib/books/formatBookStat.test.ts src/components/books/PublicBookCard.tsx
git commit -m "refactor(books): extract shared formatBookStat helper"
```

---

## Task 2: Detail mode in the ranking fetchers

**Files:**
- Modify: `src/lib/db/bookRankings.ts`
- Test: `__tests__/lib/db/bookRankings.test.ts`

- [ ] **Step 1: Write the failing tests**

Append these tests inside the `describe('bookRankings', …)` block in `__tests__/lib/db/bookRankings.test.ts` (the file mocks `@/lib/prisma` and has a `row(overrides)` helper). Add a detail-row helper and cases:

```typescript
  function detailRow(overrides: Record<string, unknown> = {}) {
    return {
      id: 'b1',
      title: 'Book One',
      authors: ['Author A'],
      createdAt: new Date('2026-05-01T00:00:00Z'),
      readerCount: 42,
      bayesianRating: 8.37,
      ratingCount: 4,
      ratingSum: 30,
      editions: [
        {
          defaultCoverProvider: null,
          customCoverUrl: null,
          hardcoverBook: { imageUrl: 'https://x/cover.jpg', description: 'HC desc' },
          googleBook: { imageUrl: null, description: 'Google desc' },
          ibdbBook: null,
          amazonBook: null,
        },
      ],
      ...overrides,
    };
  }

  it('detail mode returns averageRating, ratingCount and description', async () => {
    (mockPrisma.book.findMany as jest.Mock).mockResolvedValue([detailRow()]);
    const [book] = await getNewestBooks(12, 0, true);
    expect(book.averageRating).toBe(7.5); // 30 / 4 = 7.5
    expect(book.ratingCount).toBe(4);
    expect(book.description).toBe('Google desc'); // google preferred over hardcover
  });

  it('detail mode yields null averageRating when there are no ratings', async () => {
    (mockPrisma.book.findMany as jest.Mock).mockResolvedValue([
      detailRow({ ratingCount: 0, ratingSum: 0 }),
    ]);
    const [book] = await getNewestBooks(12, 0, true);
    expect(book.averageRating).toBeNull();
  });

  it('detail mode falls back to a null description when no provider has one', async () => {
    (mockPrisma.book.findMany as jest.Mock).mockResolvedValue([
      detailRow({
        editions: [
          {
            defaultCoverProvider: null,
            customCoverUrl: null,
            hardcoverBook: { imageUrl: 'https://x/cover.jpg', description: null },
            googleBook: null,
            ibdbBook: null,
            amazonBook: null,
          },
        ],
      }),
    ]);
    const [book] = await getNewestBooks(12, 0, true);
    expect(book.description).toBeNull();
  });
```

- [ ] **Step 2: Run them — expect failure**

Run: `npx jest __tests__/lib/db/bookRankings.test.ts`
Expected: FAIL — `getNewestBooks` has no 3-arg overload; `averageRating`/`description` don't exist on the result.

- [ ] **Step 3: Add the detail type, select, and mapper**

In `src/lib/db/bookRankings.ts`, after the `RankedBook` interface (line ~20) add:

```typescript
export interface RankedBookDetail extends RankedBook {
  averageRating: number | null;
  ratingCount: number;
  description: string | null;
}
```

After the `BASE_SELECT` block (line ~43) add the detail select and row type:

```typescript
const DETAIL_SELECT = {
  id: true,
  title: true,
  authors: true,
  createdAt: true,
  readerCount: true,
  bayesianRating: true,
  ratingCount: true,
  ratingSum: true,
  editions: {
    orderBy: { createdAt: 'asc' as const },
    take: 1,
    select: {
      defaultCoverProvider: true,
      customCoverUrl: true,
      hardcoverBook: { select: { imageUrl: true, description: true } },
      googleBook: { select: { imageUrl: true, description: true } },
      ibdbBook: { select: { imageUrl: true, description: true } },
      amazonBook: { select: { imageUrl: true } },
    },
  },
} as const;

type DetailRow = Prisma.BookGetPayload<{ select: typeof DETAIL_SELECT }>;

function toRankedBookDetail(r: DetailRow, stat: BookStat): RankedBookDetail {
  const edition = r.editions[0];
  const coverUrl = edition ? getCoverImageUrl(edition) ?? null : null;
  const description =
    edition?.googleBook?.description ||
    edition?.hardcoverBook?.description ||
    edition?.ibdbBook?.description ||
    null;
  const averageRating =
    r.ratingCount > 0 ? Math.round((r.ratingSum / r.ratingCount) * 10) / 10 : null;
  return {
    id: r.id,
    title: r.title,
    authors: r.authors,
    coverUrl,
    stat,
    averageRating,
    ratingCount: r.ratingCount,
    description,
  };
}
```

- [ ] **Step 4: Add `detail` overloads to the three fetchers**

Replace `getNewestBooks` (lines ~57-65) with:

```typescript
export function getNewestBooks(limit: number, offset: number): Promise<RankedBook[]>;
export function getNewestBooks(limit: number, offset: number, detail: true): Promise<RankedBookDetail[]>;
export async function getNewestBooks(
  limit: number,
  offset: number,
  detail = false,
): Promise<RankedBook[] | RankedBookDetail[]> {
  const order = [{ createdAt: 'desc' as const }, { id: 'asc' as const }];
  if (detail) {
    const rows = await prisma.book.findMany({ orderBy: order, take: limit, skip: offset, select: DETAIL_SELECT });
    return rows.map((r) => toRankedBookDetail(r, { kind: 'addedAt', value: r.createdAt.toISOString() }));
  }
  const rows = await prisma.book.findMany({ orderBy: order, take: limit, skip: offset, select: BASE_SELECT });
  return rows.map((r) => toRankedBook(r, { kind: 'addedAt', value: r.createdAt.toISOString() }));
}
```

Replace `getPopularBooks` (lines ~67-75) with:

```typescript
export function getPopularBooks(limit: number, offset: number): Promise<RankedBook[]>;
export function getPopularBooks(limit: number, offset: number, detail: true): Promise<RankedBookDetail[]>;
export async function getPopularBooks(
  limit: number,
  offset: number,
  detail = false,
): Promise<RankedBook[] | RankedBookDetail[]> {
  const order = [{ readerCount: 'desc' as const }, { id: 'asc' as const }];
  if (detail) {
    const rows = await prisma.book.findMany({ orderBy: order, take: limit, skip: offset, select: DETAIL_SELECT });
    return rows.map((r) => toRankedBookDetail(r, { kind: 'readers', value: r.readerCount }));
  }
  const rows = await prisma.book.findMany({ orderBy: order, take: limit, skip: offset, select: BASE_SELECT });
  return rows.map((r) => toRankedBook(r, { kind: 'readers', value: r.readerCount }));
}
```

Replace `getTopRatedBooks` (lines ~77-86) with:

```typescript
export function getTopRatedBooks(limit: number, offset: number): Promise<RankedBook[]>;
export function getTopRatedBooks(limit: number, offset: number, detail: true): Promise<RankedBookDetail[]>;
export async function getTopRatedBooks(
  limit: number,
  offset: number,
  detail = false,
): Promise<RankedBook[] | RankedBookDetail[]> {
  const where = { ratingCount: { gt: 0 } };
  const order = [{ bayesianRating: 'desc' as const }, { id: 'asc' as const }];
  if (detail) {
    const rows = await prisma.book.findMany({ where, orderBy: order, take: limit, skip: offset, select: DETAIL_SELECT });
    return rows.map((r) => toRankedBookDetail(r, { kind: 'rating', value: Math.round(r.bayesianRating * 10) / 10 }));
  }
  const rows = await prisma.book.findMany({ where, orderBy: order, take: limit, skip: offset, select: BASE_SELECT });
  return rows.map((r) => toRankedBook(r, { kind: 'rating', value: Math.round(r.bayesianRating * 10) / 10 }));
}
```

- [ ] **Step 5: Run the rankings tests — expect pass**

Run: `npx jest __tests__/lib/db/bookRankings.test.ts`
Expected: PASS (existing lean-mode tests plus the 3 new detail cases).

- [ ] **Step 6: Verify gate, then commit (requires Chad's approval)**

Run: `npm run lint && npm run type-check && npm run test && npm run build`

```bash
git add src/lib/db/bookRankings.ts __tests__/lib/db/bookRankings.test.ts
git commit -m "feat(books): add detail mode (rating + description) to ranking fetchers"
```

---

## Task 3: `BookListRow` component

**Files:**
- Create: `src/components/books/BookListRow.tsx`
- Create: `__tests__/components/books/BookListRow.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `__tests__/components/books/BookListRow.test.tsx`:

```typescript
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import BookListRow from '@/components/books/BookListRow';
import type { RankedBookDetail } from '@/lib/db/bookRankings';

jest.mock('next/link', () => {
  const MockLink = ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  );
  MockLink.displayName = 'MockLink';
  return MockLink;
});

jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...(props as Record<string, string>)} />;
  },
}));

function book(overrides: Partial<RankedBookDetail> = {}): RankedBookDetail {
  return {
    id: 'b1',
    title: 'Project Hail Mary',
    authors: ['Andy Weir'],
    coverUrl: 'https://x/cover.jpg',
    stat: { kind: 'readers', value: 42 },
    averageRating: 9,
    ratingCount: 12,
    description: '<p>A lone astronaut.</p>',
    ...overrides,
  };
}

describe('BookListRow', () => {
  it('links to the book page and shows title and author', () => {
    render(<BookListRow book={book()} />);
    expect(screen.getByRole('link')).toHaveAttribute('href', '/b/b1');
    expect(screen.getByText('Project Hail Mary')).toBeInTheDocument();
    expect(screen.getByText('Andy Weir')).toBeInTheDocument();
  });

  it('shows the score and rating count for a rated book', () => {
    render(<BookListRow book={book({ averageRating: 9, ratingCount: 12 })} />);
    expect(screen.getByText('(9.0/10)')).toBeInTheDocument();
    expect(screen.getByText('Based on 12 ratings')).toBeInTheDocument();
  });

  it('uses singular "rating" for a single rating', () => {
    render(<BookListRow book={book({ ratingCount: 1 })} />);
    expect(screen.getByText('Based on 1 rating')).toBeInTheDocument();
  });

  it('omits the rating count line when there are no ratings', () => {
    render(<BookListRow book={book({ averageRating: null, ratingCount: 0 })} />);
    expect(screen.queryByText(/Based on/)).not.toBeInTheDocument();
  });

  it('renders the section stat for readers but not for a rating stat', () => {
    const { rerender } = render(<BookListRow book={book({ stat: { kind: 'readers', value: 42 } })} />);
    expect(screen.getByText('42 readers')).toBeInTheDocument();
    rerender(<BookListRow book={book({ stat: { kind: 'rating', value: 9 } })} />);
    expect(screen.queryByText(/avg/)).not.toBeInTheDocument();
  });

  it('renders a sanitized description and omits it when absent', () => {
    const { rerender } = render(<BookListRow book={book({ description: '<p>A lone astronaut.</p>' })} />);
    expect(screen.getByText('A lone astronaut.')).toBeInTheDocument();
    rerender(<BookListRow book={book({ description: null })} />);
    expect(screen.queryByText('A lone astronaut.')).not.toBeInTheDocument();
  });

  it('shows the cover placeholder when there is no cover', () => {
    render(<BookListRow book={book({ coverUrl: null })} />);
    expect(screen.getByTestId('cover-placeholder')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run it — expect failure**

Run: `npx jest __tests__/components/books/BookListRow.test.tsx`
Expected: FAIL — `Cannot find module '@/components/books/BookListRow'`.

- [ ] **Step 3: Create the component**

Create `src/components/books/BookListRow.tsx`:

```tsx
import Link from 'next/link';
import Image from 'next/image';
import StarRating from '@/components/rating/StarRating';
import { sanitizeHtml } from '@/lib/utils/sanitize';
import { formatBookStat } from '@/lib/books/formatBookStat';
import type { RankedBookDetail } from '@/lib/db/bookRankings';

export default function BookListRow({ book }: { book: RankedBookDetail }) {
  // The rating stat is already shown by the rating block, so only addedAt/readers
  // get a dedicated section-stat line.
  const sectionStat = book.stat.kind === 'rating' ? null : formatBookStat(book.stat);

  return (
    <Link
      href={`/b/${book.id}`}
      aria-label={book.title}
      className="group flex gap-5 rounded-lg border border-border bg-card p-4 transition-colors hover:bg-muted"
    >
      <div className="relative aspect-[2/3] w-24 flex-none overflow-hidden rounded-md bg-muted">
        {book.coverUrl ? (
          <Image
            src={book.coverUrl}
            alt=""
            fill
            sizes="96px"
            className="object-cover"
            unoptimized
          />
        ) : (
          <div
            data-testid="cover-placeholder"
            aria-hidden="true"
            className="flex h-full w-full items-center justify-center"
          >
            <svg
              className="w-8 h-10 text-muted-foreground/40"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="text-lg font-semibold text-card-foreground">{book.title}</h3>
        <p className="text-sm text-muted-foreground">{book.authors.join(', ')}</p>

        <div className="mt-2 flex items-center gap-2">
          <StarRating rating={book.averageRating} showAverage={false} size="sm" />
          {book.averageRating !== null && (
            <span className="text-xs text-muted-foreground">({book.averageRating.toFixed(1)}/10)</span>
          )}
        </div>
        {book.ratingCount > 0 && (
          <p className="text-xs text-muted-foreground">
            Based on {book.ratingCount} {book.ratingCount === 1 ? 'rating' : 'ratings'}
          </p>
        )}

        {sectionStat && <p className="mt-1 text-xs font-medium text-primary">{sectionStat}</p>}

        {book.description && (
          <div
            className="mt-2 line-clamp-3 text-sm text-muted-foreground"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(book.description) }}
          />
        )}
      </div>
    </Link>
  );
}
```

- [ ] **Step 4: Run it — expect pass**

Run: `npx jest __tests__/components/books/BookListRow.test.tsx`
Expected: PASS (7 tests).

Note: `(9.0/10)` is produced by `book.averageRating.toFixed(1)` with `averageRating: 9`. `StarRating` with `showAverage={false}` renders only stars, so the score text is unique.

- [ ] **Step 5: Verify gate, then commit (requires Chad's approval)**

Run: `npm run lint && npm run type-check && npm run test && npm run build`

```bash
git add src/components/books/BookListRow.tsx __tests__/components/books/BookListRow.test.tsx
git commit -m "feat(books): add BookListRow rich row component"
```

---

## Task 4: Wire the section pages, API, and client to detail rows

**Files:**
- Modify: `src/components/books/BooksSectionClient.tsx`
- Modify: `__tests__/components/books/BooksSectionClient.test.tsx`
- Modify: `src/app/books/[section]/page.tsx`
- Modify: `src/app/api/books/route.ts`

- [ ] **Step 1: Update the client test fixtures to detail rows**

In `__tests__/components/books/BooksSectionClient.test.tsx`, change the type import and the `mk` helper:

Replace `import type { RankedBook } from '@/lib/db/bookRankings';` with:

```typescript
import type { RankedBookDetail } from '@/lib/db/bookRankings';
```

Replace the `mk` helper with:

```typescript
function mk(id: string): RankedBookDetail {
  return {
    id,
    title: id,
    authors: ['A'],
    coverUrl: null,
    stat: { kind: 'readers', value: 1 },
    averageRating: null,
    ratingCount: 0,
    description: null,
  };
}
```

(The existing assertions — `getByText(id)`, the fetch URL, dedup `getAllByText('b1')` — stay valid: `BookListRow` renders the title as text and an unrated row shows no "Based on" line or description, so the only text matching `id` is the title.)

- [ ] **Step 2: Run the client test — expect failure**

Run: `npx jest __tests__/components/books/BooksSectionClient.test.tsx`
Expected: FAIL — `BooksSectionClient` still imports/uses `PublicBookCard` typed to `RankedBook`, so the `RankedBookDetail[]` props/state are a type mismatch and the rows aren't `BookListRow` yet. (If it happens to render, the layout assertions still guide the change.)

- [ ] **Step 3: Switch the client to a list of `BookListRow`**

In `src/components/books/BooksSectionClient.tsx`:

Replace the import line `import PublicBookCard from './PublicBookCard';` with:

```typescript
import BookListRow from './BookListRow';
```

Replace `import type { RankedBook } from '@/lib/db/bookRankings';` with:

```typescript
import type { RankedBookDetail } from '@/lib/db/bookRankings';
```

Change every `RankedBook` in this file to `RankedBookDetail` (the `initialBooks` prop, the `useState<…>` generic, and the `data: { books: …; hasMore }` annotation in `loadMore`).

Replace the grid container and its mapping:

```tsx
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {books.map((book) => (
          <PublicBookCard key={book.id} book={book} />
        ))}
      </div>
```

with:

```tsx
      <div className="flex flex-col gap-4">
        {books.map((book) => (
          <BookListRow key={book.id} book={book} />
        ))}
      </div>
```

- [ ] **Step 4: Run the client test — expect pass**

Run: `npx jest __tests__/components/books/BooksSectionClient.test.tsx`
Expected: PASS (all 4 tests — SSR render, retry, append, dedup).

- [ ] **Step 5: Fetch detail mode in the section page**

In `src/app/books/[section]/page.tsx`:

Change the `SECTION_MAP` type and entries' fetcher signature so it returns detail rows. Update the type annotation on `SECTION_MAP`:

```typescript
const SECTION_MAP: Record<
  string,
  { title: string; fetcher: (limit: number, offset: number, detail: true) => Promise<RankedBookDetail[]> }
> = {
  newest: { title: 'Newest', fetcher: getNewestBooks },
  popular: { title: 'Most Popular', fetcher: getPopularBooks },
  'top-rated': { title: 'Top Rated', fetcher: getTopRatedBooks },
};
```

Update the import to add the type:

```typescript
import {
  getNewestBooks,
  getPopularBooks,
  getTopRatedBooks,
  type RankedBookDetail,
} from '@/lib/db/bookRankings';
```

(Remove the now-unused `type RankedBook` import if present.)

Change the fetch call in the page body from `await config.fetcher(BOOKS_PAGE_SIZE + 1, 0)` to:

```typescript
  const rows = await config.fetcher(BOOKS_PAGE_SIZE + 1, 0, true);
```

- [ ] **Step 6: Fetch detail mode in the load-more API**

In `src/app/api/books/route.ts`:

Update the import and `SECTIONS` type to detail, and pass `true` to the fetcher.

Replace the import block:

```typescript
import {
  getNewestBooks,
  getPopularBooks,
  getTopRatedBooks,
  type RankedBookDetail,
} from '@/lib/db/bookRankings';
```

Replace the `SECTIONS` declaration:

```typescript
const SECTIONS: Record<
  string,
  (limit: number, offset: number, detail: true) => Promise<RankedBookDetail[]>
> = {
  newest: getNewestBooks,
  popular: getPopularBooks,
  'top-rated': getTopRatedBooks,
};
```

Change the fetch call from `await fetcher(limit + 1, offset)` to:

```typescript
    const rows = await fetcher(limit + 1, offset, true);
```

- [ ] **Step 7: Full verification, then commit (requires Chad's approval)**

Run: `npm run lint && npm run type-check && npm run test && npm run build`
Expected: all pass; `/books/[section]` builds.

```bash
git add src/components/books/BooksSectionClient.tsx __tests__/components/books/BooksSectionClient.test.tsx "src/app/books/[section]/page.tsx" src/app/api/books/route.ts
git commit -m "feat(books): render section pages as rich list rows"
```

---

## Self-Review Notes

- **Spec coverage:** scope = section pages only (Task 4 leaves `/books` landing + `PublicBookCard` on cards); `BookListRow` content incl. rating block, section stat, sanitized 3-line description (Task 3); detail data layer with `averageRating = round(ratingSum/ratingCount,1)` / null + description (Task 2); shared `formatBookStat` (Task 1); wiring of page + API + client (Task 4). Edge cases (unrated → "Not rated", count line omitted; no description omitted; Top-Rated no duplicate stat) covered by `BookListRow` (Task 3) and tested.
- **Type consistency:** `RankedBookDetail extends RankedBook` with `averageRating: number | null`, `ratingCount: number`, `description: string | null` — used identically in `bookRankings.ts`, `BookListRow`, `BooksSectionClient`, the section page, and the API. Fetcher detail overload signature `(limit, offset, detail: true) => Promise<RankedBookDetail[]>` matches every call site (`config.fetcher(…, true)`, `fetcher(…, true)`).
- **No placeholders:** every code/step block is concrete; commands have expected output.
- **`StarRating` reuse:** passes `rating: number | null`; renders "Not rated" for null. The `(x/10)` text is rendered separately and only when `averageRating !== null`, matching the book-page hero.
