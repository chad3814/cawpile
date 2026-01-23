# Task Breakdown: Centralize Cover Image Selection

## Overview
Total Tasks: 25

This feature centralizes cover image selection across all profile, share, and public review components to use the existing `getCoverImageUrl()` utility with proper multi-provider fallback (Hardcover > Google > IBDB) and user preference support.

## Task List

### Type Definitions

#### Task Group 1: Update Profile Type Definitions
**Dependencies:** None

- [x] 1.0 Complete profile type updates
  - [x] 1.1 Write 2-4 focused tests for profile type compatibility
    - Test that `ProfileBookData.edition` type accepts all three provider image fields
    - Test that `ProfileSharedReview.userBook.edition` type accepts all three provider image fields
    - Test that types work with `getCoverImageUrl()` utility function
  - [x] 1.2 Update `ProfileBookData.edition` type in `/src/types/profile.ts`
    - Add `hardcoverBook: { imageUrl: string | null } | null` field
    - Add `ibdbBook: { imageUrl: string | null } | null` field
    - Add `preferredCoverProvider?: string | null` field to `ProfileBookData`
    - Follow pattern from `DashboardBookData` in `/src/types/dashboard.ts`
  - [x] 1.3 Update `ProfileSharedReview.userBook.edition` type in `/src/types/profile.ts`
    - Add `hardcoverBook: { imageUrl: string | null } | null` field
    - Add `ibdbBook: { imageUrl: string | null } | null` field
    - Add `preferredCoverProvider?: string | null` to `userBook` level
  - [x] 1.4 Verify type compatibility with existing `getCoverImageUrl()` utility
    - Ensure `EditionWithProviders` interface from `/src/lib/utils/getCoverImageUrl.ts` is compatible
    - Run TypeScript compiler to verify no type errors
  - [x] 1.5 Ensure type definition tests pass
    - Run ONLY the 2-4 tests written in 1.1
    - Verify TypeScript compilation succeeds

**Acceptance Criteria:**
- Profile types include all three provider image URL fields
- Profile types include `preferredCoverProvider` field
- Types are compatible with `getCoverImageUrl()` utility
- TypeScript compilation passes with no errors

### Database Queries

#### Task Group 2: Update Profile Database Queries
**Dependencies:** Task Group 1

- [x] 2.0 Complete database query updates
  - [x] 2.1 Write 3-6 focused tests for profile data queries
    - Test `getProfileCurrentlyReading` returns all provider image URLs
    - Test `getProfileTbr` returns all provider image URLs
    - Test `getProfileSharedReviews` returns all provider image URLs
    - Test queries include `preferredCoverProvider` field
  - [x] 2.2 Update `getProfileCurrentlyReading.ts`
    - File: `/src/lib/db/getProfileCurrentlyReading.ts`
    - Add `hardcoverBook: { select: { imageUrl: true } }` to edition include
    - Add `ibdbBook: { select: { imageUrl: true } }` to edition include
    - Add `preferredCoverProvider` to selected UserBook fields
    - Update return mapping to include new fields
  - [x] 2.3 Update `getProfileTbr.ts`
    - File: `/src/lib/db/getProfileTbr.ts`
    - Add `hardcoverBook: { select: { imageUrl: true } }` to edition include
    - Add `ibdbBook: { select: { imageUrl: true } }` to edition include
    - Add `preferredCoverProvider` to selected UserBook fields
    - Update return mapping to include new fields
  - [x] 2.4 Update `getProfileSharedReviews.ts`
    - File: `/src/lib/db/getProfileSharedReviews.ts`
    - Add `hardcoverBook: { select: { imageUrl: true } }` to edition include
    - Add `ibdbBook: { select: { imageUrl: true } }` to edition include
    - Add `preferredCoverProvider` to userBook selection
    - Update return mapping to include new fields
  - [x] 2.5 Update share review API route
    - File: `/src/app/api/share/reviews/[shareToken]/route.ts`
    - Add `hardcoverBook` and `ibdbBook` relations to prisma query
    - Add `preferredCoverProvider` to selected fields
    - Include in response: `hardcoverBook.imageUrl`, `ibdbBook.imageUrl`, `preferredCoverProvider`
  - [x] 2.6 Ensure database query tests pass
    - Run ONLY the 3-6 tests written in 2.1
    - Verify queries return expected data structure

**Acceptance Criteria:**
- All profile queries return Hardcover, Google, and IBDB image URLs
- All profile queries return `preferredCoverProvider` field
- API response includes all provider image URLs
- No unnecessary data fetched (only `imageUrl` from each provider)

### Profile Components

#### Task Group 3: Update Profile Components to Use Centralized Utility
**Dependencies:** Task Groups 1, 2

- [x] 3.0 Complete profile component updates
  - [x] 3.1 Write 4-6 focused tests for profile component cover image display
    - Test `ProfileBookCard` uses `getCoverImageUrl()` correctly
    - Test `TbrBookCard` uses `getCoverImageUrl()` correctly
    - Test `SharedReviewCard` uses `getCoverImageUrl()` correctly
    - Test components fall back correctly when preferred provider has no image
  - [x] 3.2 Update `ProfileBookCard.tsx`
    - File: `/src/components/profile/ProfileBookCard.tsx`
    - Add import: `import { getCoverImageUrl } from '@/lib/utils/getCoverImageUrl'`
    - Replace `const imageUrl = book.edition.googleBook?.imageUrl`
    - With: `const imageUrl = getCoverImageUrl(book.edition, book.preferredCoverProvider)`
    - Follow pattern from `/src/components/dashboard/BookCard.tsx` line 65
  - [x] 3.3 Update `TbrBookCard.tsx`
    - File: `/src/components/profile/TbrBookCard.tsx`
    - Add import: `import { getCoverImageUrl } from '@/lib/utils/getCoverImageUrl'`
    - Replace `const imageUrl = book.edition.googleBook?.imageUrl`
    - With: `const imageUrl = getCoverImageUrl(book.edition, book.preferredCoverProvider)`
  - [x] 3.4 Update `SharedReviewCard.tsx`
    - File: `/src/components/profile/SharedReviewCard.tsx`
    - Add import: `import { getCoverImageUrl } from '@/lib/utils/getCoverImageUrl'`
    - Replace `const imageUrl = userBook.edition.googleBook?.imageUrl`
    - With: `const imageUrl = getCoverImageUrl(userBook.edition, userBook.preferredCoverProvider)`
  - [x] 3.5 Ensure profile component tests pass
    - Run ONLY the 4-6 tests written in 3.1
    - Verify components render covers correctly

**Acceptance Criteria:**
- All profile components use `getCoverImageUrl()` utility
- Components respect user's `preferredCoverProvider` setting
- Components fall back to priority order when preferred provider has no image
- Visual parity maintained with existing functionality

### Share Components

#### Task Group 4: Update Share and Public Review Components
**Dependencies:** Task Groups 1, 2

- [x] 4.0 Complete share component updates
  - [x] 4.1 Write 3-5 focused tests for share component cover image display
    - Test `PublicReviewDisplay` uses `getCoverImageUrl()` correctly
    - Test `ShareReviewModal` uses `getCoverImageUrl()` for thumbnail
    - Test `ShareReviewModal` passes correct cover URL to `ReviewImageTemplate`
  - [x] 4.2 Update `PublicReviewDisplay.tsx`
    - File: `/src/components/share/PublicReviewDisplay.tsx`
    - Add import: `import { getCoverImageUrl } from '@/lib/utils/getCoverImageUrl'`
    - Update `PublicReviewDisplayProps` interface to include all provider image URLs
    - Replace `const imageUrl = edition.googleBook?.imageUrl`
    - With: `const imageUrl = getCoverImageUrl(edition, userBook.preferredCoverProvider)`
    - Update props interface to accept `hardcoverBook`, `ibdbBook`, `preferredCoverProvider`
  - [x] 4.3 Update `ShareReviewModal.tsx`
    - File: `/src/components/modals/ShareReviewModal.tsx`
    - Add import: `import { getCoverImageUrl } from '@/lib/utils/getCoverImageUrl'`
    - Update `ShareReviewModalProps.userBook.edition` interface to include all providers
    - Replace `const imageUrl = userBook.edition.googleBook?.imageUrl`
    - With: `const imageUrl = getCoverImageUrl(userBook.edition, userBook.preferredCoverProvider)`
    - Add `preferredCoverProvider` to `userBook` props interface
    - Update `ReviewImageTemplate` `coverUrl` prop to use centralized selection
  - [x] 4.4 Verify parent components pass complete edition data
    - Check `/src/components/dashboard/BookCard.tsx` passes full edition to `ShareReviewModal`
    - Confirm `book.edition` already includes all provider data from `DashboardBookData`
  - [x] 4.5 Ensure share component tests pass
    - Run ONLY the 3-5 tests written in 4.1
    - Verify cover images display correctly

**Acceptance Criteria:**
- `PublicReviewDisplay` uses centralized cover selection
- `ShareReviewModal` uses centralized cover selection for thumbnail and image template
- Props interfaces updated to accept all provider image URLs
- Generated share images use correct cover based on user preference

### Image Proxy

#### Task Group 5: Extend Image Proxy for All Providers
**Dependencies:** None (can run in parallel with Task Groups 1-4)

- [x] 5.0 Complete image proxy updates
  - [x] 5.1 Write 4-6 focused tests for image proxy domain validation
    - Test proxy accepts Google Books domains (existing behavior)
    - Test proxy accepts Hardcover CDN domains
    - Test proxy accepts IBDB image domains
    - Test proxy rejects unknown domains
    - Test proxy handles invalid URLs gracefully
  - [x] 5.2 Update image proxy allowed domains
    - File: `/src/app/api/proxy/image/route.ts`
    - Add Hardcover domains to `allowedDomains` array:
      - `cdn.hardcover.app`
      - `hardcover.app`
      - `storage.googleapis.com` (Hardcover may use GCS)
    - Add IBDB domains to `allowedDomains` array:
      - `ibdb.dev`
      - `covers.ibdb.dev` (if applicable)
      - `storage.googleapis.com` (IBDB may use GCS)
    - Keep existing Google Books domains
  - [x] 5.3 Create proxy-aware cover URL helper
    - File: `/src/lib/utils/getProxiedCoverImageUrl.ts` (new file)
    - Import `getCoverImageUrl` from `./getCoverImageUrl`
    - Create function `getProxiedCoverImageUrl(edition, preferredProvider?, shouldProxy?)`
    - When `shouldProxy` is true, wrap result in `/api/proxy/image?url=`
    - Export for use in image generation contexts (html2canvas scenarios)
  - [x] 5.4 Update `ShareReviewModal` to use proxied URL for image generation
    - Import `getProxiedCoverImageUrl` helper
    - Use for `coverDataUrl` when generating images with html2canvas
    - Keep non-proxied URL for regular display
  - [x] 5.5 Ensure image proxy tests pass
    - Run ONLY the 4-6 tests written in 5.1
    - Verify proxy accepts all expected domains

**Acceptance Criteria:**
- Image proxy accepts Hardcover, Google, and IBDB image domains
- Proxy rejects URLs from non-whitelisted domains
- New helper function handles proxy wrapping for image generation
- Share image generation works with all provider cover images

### Integration Testing

#### Task Group 6: Test Review and Gap Analysis
**Dependencies:** Task Groups 1-5

- [x] 6.0 Review existing tests and fill critical gaps only
  - [x] 6.1 Review tests from Task Groups 1-5
    - Review 2-4 tests from type definitions (Task 1.1)
    - Review 3-6 tests from database queries (Task 2.1)
    - Review 4-6 tests from profile components (Task 3.1)
    - Review 3-5 tests from share components (Task 4.1)
    - Review 4-6 tests from image proxy (Task 5.1)
    - Total existing tests: approximately 16-27 tests
  - [x] 6.2 Analyze test coverage gaps for this feature only
    - Identify any untested critical user workflows
    - Focus on integration between components and data layer
    - Prioritize end-to-end cover image selection flow
  - [x] 6.3 Write up to 5 additional strategic tests if needed
    - Add tests for integration points not covered by unit tests
    - Test full flow: database query -> component -> correct cover displayed
    - Test preference override works end-to-end
    - Skip edge cases and exhaustive provider combinations
  - [x] 6.4 Run feature-specific tests only
    - Run ONLY tests related to this feature
    - Expected total: approximately 21-32 tests maximum
    - Do NOT run the entire application test suite
    - Verify all critical workflows pass

**Acceptance Criteria:**
- All feature-specific tests pass (approximately 21-32 tests total)
- Cover image selection works correctly across all affected components
- User preference is respected throughout the application
- Fallback priority (Hardcover > Google > IBDB) works correctly

## Execution Order

Recommended implementation sequence:

```
Phase 1 (Parallel):
  - Task Group 1: Type Definitions
  - Task Group 5: Image Proxy (no dependencies on types)

Phase 2 (Sequential after Phase 1):
  - Task Group 2: Database Queries (depends on Task Group 1)

Phase 3 (Parallel after Phase 2):
  - Task Group 3: Profile Components (depends on Task Groups 1, 2)
  - Task Group 4: Share Components (depends on Task Groups 1, 2)

Phase 4 (Final):
  - Task Group 6: Integration Testing (depends on all previous groups)
```

## File Reference

### Files to Modify

| File Path | Task Group |
|-----------|------------|
| `/src/types/profile.ts` | 1 |
| `/src/lib/db/getProfileCurrentlyReading.ts` | 2 |
| `/src/lib/db/getProfileTbr.ts` | 2 |
| `/src/lib/db/getProfileSharedReviews.ts` | 2 |
| `/src/app/api/share/reviews/[shareToken]/route.ts` | 2 |
| `/src/components/profile/ProfileBookCard.tsx` | 3 |
| `/src/components/profile/TbrBookCard.tsx` | 3 |
| `/src/components/profile/SharedReviewCard.tsx` | 3 |
| `/src/components/share/PublicReviewDisplay.tsx` | 4 |
| `/src/components/modals/ShareReviewModal.tsx` | 4 |
| `/src/app/api/proxy/image/route.ts` | 5 |

### Files to Create

| File Path | Task Group |
|-----------|------------|
| `/src/lib/utils/getProxiedCoverImageUrl.ts` | 5 |

### Reference Files (Read Only)

| File Path | Purpose |
|-----------|---------|
| `/src/lib/utils/getCoverImageUrl.ts` | Existing utility to reuse |
| `/src/types/dashboard.ts` | Pattern for type definitions |
| `/src/components/dashboard/BookCard.tsx` | Pattern for component implementation |

## Notes

- The `getCoverImageUrl()` utility already implements the correct priority order (Hardcover > Google > IBDB)
- The dashboard components (`BookCard.tsx`, `BookTable.tsx`) already use the centralized utility correctly
- Profile and share components need to be updated to match the dashboard pattern
- Image proxy needs domain expansion but no logic changes
- `ReviewImageTemplate.tsx` receives `coverUrl` as a prop and requires no changes
