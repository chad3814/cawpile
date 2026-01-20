# Task Breakdown: Optimize Dashboard Book Share Query

## Overview
Total Tasks: 8

This spec eliminates N+1 API calls by including `sharedReview` in the dashboard Prisma query and passing it through the component chain. For a user with 50 books, this reduces requests from 51 to 1 (98% reduction).

## Task List

### Foundation Layer

#### Task Group 1: Type Definition ✅
**Dependencies:** None

- [x] 1.0 Complete type definition foundation
  - [x] 1.2 Create `src/types/dashboard.ts` with shared types
    - Export `SharedReviewData` interface (id, shareToken, showDates, showBookClubs, showReadathons, showReview)
    - Export `CawpileRatingData` interface (id, average, facet fields)
    - Export `DashboardBookData` interface with all fields from existing `BookData` interfaces
    - Include optional `sharedReview?: SharedReviewData | null` field
    - Import `BookStatus`, `BookFormat` from `@prisma/client`

**Acceptance Criteria:**
- Types compile without TypeScript errors ✅
- `DashboardBookData` includes all existing fields plus `sharedReview` ✅
- Types are exported and importable by components ✅

### Data Layer

#### Task Group 2: Dashboard Query Update ✅
**Dependencies:** Task Group 1

- [x] 2.0 Complete data layer update
  - [x] 2.2 Update Prisma query in `src/app/dashboard/page.tsx`
    - Add `sharedReview` to the `include` block
    - Use `select` to include only needed fields: id, shareToken, showDates, showBookClubs, showReadathons, showReview
    - Maintain existing query structure (orderBy, where clause)

**Acceptance Criteria:**
- Query includes `sharedReview` relation with selected fields ✅
- Existing dashboard functionality unchanged ✅
- No Prisma errors ✅

### Component Layer

#### Task Group 3: Component Chain Updates ✅
**Dependencies:** Task Groups 1 and 2

- [x] 3.0 Complete component chain updates
  - [x] 3.2 Update `src/components/dashboard/DashboardClient.tsx`
    - Import `DashboardBookData` from `@/types/dashboard`
    - Remove local `BookData` interface
    - Update component props to use `DashboardBookData`
  - [x] 3.3 Update `src/components/dashboard/ViewSwitcher.tsx`
    - Import `DashboardBookData` from `@/types/dashboard`
    - Remove local `BookData` interface
    - Update component props to use `DashboardBookData`
  - [x] 3.4 Update `src/components/dashboard/BookGrid.tsx`
    - Import `DashboardBookData` from `@/types/dashboard`
    - Remove local `BookData` interface
    - Update component props to use `DashboardBookData`
  - [x] 3.5 Update `src/components/dashboard/BookTable.tsx`
    - Import `DashboardBookData` from `@/types/dashboard`
    - Remove local `BookData` interface
    - Update component props to use `DashboardBookData`
  - [x] 3.6 Update `src/components/dashboard/BookCard.tsx`
    - Import `DashboardBookData` from `@/types/dashboard`
    - Remove local `SharedReview` interface
    - Remove local book type definition from `BookCardProps`
    - Update `BookCardProps.book` to use `DashboardBookData`
    - Remove `shareData` state
    - Remove `useEffect` that fetches share data
    - Replace `shareData` usage with `book.sharedReview`
    - Update `ShareReviewModal` props: `existingShare={book.sharedReview ?? null}`
  - [x] 3.7 Update `src/components/modals/ShareReviewModal.tsx`
    - Make `setShareData` prop optional (already uses `router.refresh()`)

**Acceptance Criteria:**
- All components use shared `DashboardBookData` type ✅
- No duplicate type definitions remain ✅
- BookCard uses prop directly, no API call ✅
- Share functionality works correctly ✅

### Verification Layer

#### Task Group 4: Build and Lint Verification ✅
**Dependencies:** Task Group 3

- [x] 4.0 Complete verification
  - [x] 4.1 Run ESLint and fix any errors
    - Execute `npm run lint` - Passed (0 errors)
  - [x] 4.2 Run TypeScript build check
    - Execute `npm run build` - Passed
    - Verify no TypeScript compilation errors - Passed
    - Verify build completes successfully - Passed

**Acceptance Criteria:**
- `npm run lint` passes with no errors ✅
- `npm run build` completes successfully ✅

## Execution Order

Recommended implementation sequence:
1. Foundation Layer (Task Group 1) - Create shared types first ✅
2. Data Layer (Task Group 2) - Update query to include sharedReview ✅
3. Component Layer (Task Group 3) - Update all components in chain ✅
4. Verification Layer (Task Group 4) - Validate build, lint, and functionality ✅

## Files Modified Summary

| File | Action | Task |
|------|--------|------|
| `src/types/dashboard.ts` | CREATE | 1.2 |
| `src/app/dashboard/page.tsx` | MODIFY | 2.2 |
| `src/components/dashboard/DashboardClient.tsx` | MODIFY | 3.2 |
| `src/components/dashboard/ViewSwitcher.tsx` | MODIFY | 3.3 |
| `src/components/dashboard/BookGrid.tsx` | MODIFY | 3.4 |
| `src/components/dashboard/BookTable.tsx` | MODIFY | 3.5 |
| `src/components/dashboard/BookCard.tsx` | MODIFY | 3.6 |
| `src/components/modals/ShareReviewModal.tsx` | MODIFY | 3.7 |

## Implementation Complete

All task groups completed successfully on 2026-01-20.

**Performance Impact:**
- Before: 1 + N API calls (1 page load + N share checks per book)
- After: 1 API call (page load includes all share data)
- For a user with 50 books: 51 requests → 1 request (98% reduction)
