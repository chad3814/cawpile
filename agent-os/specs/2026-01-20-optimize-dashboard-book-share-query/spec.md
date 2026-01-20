# Specification: Optimize Dashboard Book Share Query

## Problem Statement

The dashboard currently suffers from an N+1 query problem when checking if books have been shared:

1. The dashboard page (`src/app/dashboard/page.tsx`) queries all user books with Prisma
2. Books are passed through the component chain: `DashboardClient` → `ViewSwitcher` → `BookGrid` → `BookCard`
3. Each `BookCard` component has a `useEffect` that makes an individual API call to `/api/user/books/${book.id}/share` to check if that book has been shared

For a user with 50 books, this results in 50+ API calls on dashboard load, causing:
- Unnecessary network overhead
- Slower page load/interactivity
- Server load from handling many concurrent requests

## Solution

Include the `sharedReview` relation in the original Prisma query and pass it through the component chain, eliminating all N+1 API calls.

## Technical Approach

### 1. Create Shared Type Definition

Create a new file `src/types/dashboard.ts` to consolidate the duplicated `BookData` interface currently defined in:
- `DashboardClient.tsx` (lines 11-44)
- `ViewSwitcher.tsx` (lines 8-41)
- `BookGrid.tsx` (lines 7-40)
- `BookTable.tsx` (lines 9-42)
- `BookCard.tsx` (lines 33-83 as `BookCardProps.book`)

The new type will include the optional `sharedReview` field:

```typescript
// src/types/dashboard.ts
import { BookStatus, BookFormat } from '@prisma/client'

export interface SharedReviewData {
  id: string
  shareToken: string
  showDates: boolean
  showBookClubs: boolean
  showReadathons: boolean
  showReview: boolean
}

export interface CawpileRatingData {
  id: string
  average: number
  characters: number | null
  atmosphere: number | null
  writing: number | null
  plot: number | null
  intrigue: number | null
  logic: number | null
  enjoyment: number | null
}

export interface DashboardBookData {
  id: string
  status: BookStatus
  format: BookFormat[]
  progress: number
  startDate: Date | null
  finishDate: Date | null
  createdAt: Date
  review?: string | null
  acquisitionMethod?: string | null
  acquisitionOther?: string | null
  bookClubName?: string | null
  readathonName?: string | null
  isReread?: boolean | null
  dnfReason?: string | null
  lgbtqRepresentation?: string | null
  lgbtqDetails?: string | null
  disabilityRepresentation?: string | null
  disabilityDetails?: string | null
  isNewAuthor?: boolean | null
  authorPoc?: string | null
  authorPocDetails?: string | null
  notes?: string | null
  edition: {
    id: string
    title: string | null
    book: {
      title: string
      authors: string[]
      bookType?: 'FICTION' | 'NONFICTION'
    }
    googleBook: {
      imageUrl: string | null
      description: string | null
      pageCount: number | null
    } | null
  }
  cawpileRating?: CawpileRatingData | null
  sharedReview?: SharedReviewData | null  // NEW FIELD
}
```

### 2. Update Dashboard Query

Modify `src/app/dashboard/page.tsx` to include the `sharedReview` relation:

```typescript
const userBooks = await prisma.userBook.findMany({
  where: { userId: user.id },
  include: {
    edition: {
      include: {
        book: true,
        googleBook: true
      }
    },
    cawpileRating: true,
    sharedReview: {  // ADD THIS
      select: {
        id: true,
        shareToken: true,
        showDates: true,
        showBookClubs: true,
        showReadathons: true,
        showReview: true,
      }
    }
  },
  orderBy: buildOrderBy(sortBy, sortOrder)
})
```

### 3. Update Component Chain

All components in the chain need to:
1. Import the shared `DashboardBookData` type
2. Remove their local `BookData` interface
3. Pass the `sharedReview` data through

**Files to update:**
- `src/components/dashboard/DashboardClient.tsx`
- `src/components/dashboard/ViewSwitcher.tsx`
- `src/components/dashboard/BookGrid.tsx`
- `src/components/dashboard/BookTable.tsx`
- `src/components/dashboard/BookCard.tsx`

### 4. Update BookCard Component

The most significant change is in `BookCard.tsx`:

**Remove:**
- The `useEffect` that fetches share data (lines 139-157)
- The `shareData` state (line 117)
- The local `SharedReview` interface (lines 24-31)

**Change:**
- Use `book.sharedReview` prop directly instead of `shareData` state
- Pass `book.sharedReview` to `ShareReviewModal` as `existingShare` prop

**Before:**
```typescript
const [shareData, setShareData] = useState<SharedReview | null>(null)

useEffect(() => {
  if (canShare) {
    fetch(`/api/user/books/${book.id}/share`)
      .then(res => res.ok ? res.json() : null)
      .then(data => data && setShareData(data))
      .catch(() => {})
  }
}, [book.id, canShare])

// Later...
<ShareReviewModal existingShare={shareData} setShareData={setShareData} />
```

**After:**
```typescript
// No state needed, no useEffect needed

// Later...
<ShareReviewModal existingShare={book.sharedReview ?? null} />
```

**Note on ShareReviewModal:** The modal currently accepts a `setShareData` prop to update the parent's state when a share is created/updated. Since we're eliminating state, after creating/updating a share, the modal should trigger a `router.refresh()` to refetch the data from the server. This maintains the pattern used elsewhere in the codebase.

### 5. Update BookTable Component

BookTable doesn't currently display share information, but for consistency and future-proofing, it should accept the `sharedReview` field in its book data type. This is handled automatically by using the shared `DashboardBookData` type.

## Files to Modify

| File | Changes |
|------|---------|
| `src/types/dashboard.ts` | **CREATE** - New shared type definitions |
| `src/app/dashboard/page.tsx` | Add `sharedReview` to Prisma include |
| `src/components/dashboard/DashboardClient.tsx` | Import shared type, remove local interface |
| `src/components/dashboard/ViewSwitcher.tsx` | Import shared type, remove local interface |
| `src/components/dashboard/BookGrid.tsx` | Import shared type, remove local interface |
| `src/components/dashboard/BookTable.tsx` | Import shared type, remove local interface |
| `src/components/dashboard/BookCard.tsx` | Remove useEffect, use prop directly, remove local interfaces |

## Out of Scope

- Changes to `/api/user/books/[id]/share` endpoint (remains available for other uses)
- Changes to the SharedReview Prisma model
- UI/UX changes
- Other performance optimizations

## Acceptance Criteria

1. Dashboard loads without N+1 API calls for share status
2. Share functionality continues to work correctly (share modal, existing shares displayed)
3. No TypeScript errors
4. Build passes
5. Lint passes

## Performance Impact

- **Before:** 1 + N API calls (1 page load + N share checks per book)
- **After:** 1 API call (page load includes all share data)

For a user with 50 books: 51 requests → 1 request (98% reduction)
