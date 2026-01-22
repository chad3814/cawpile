# Task Breakdown: Cover Image Selection

## Overview
Total Tasks: 24 sub-tasks across 5 task groups

This feature allows users to select their preferred cover image from available book providers (Hardcover, Google Books, IBDB) via a new "Cover" tab in the Edit Book Details modal.

## Task List

### Database Layer

#### Task Group 1: Database Schema and Migration
**Dependencies:** None

- [x] 1.0 Complete database layer
  - [x] 1.1 Write 3 focused tests for preferredCoverProvider field functionality
    - Test that UserBook model accepts valid provider values ('hardcover', 'google', 'ibdb')
    - Test that UserBook model accepts null value (default behavior)
    - Test that invalid provider values are rejected
  - [x] 1.2 Add `preferredCoverProvider` field to UserBook model in Prisma schema
    - Field type: `String?` (optional)
    - Values: 'hardcover' | 'google' | 'ibdb' | null
    - Location: `prisma/schema.prisma`
  - [x] 1.3 Create migration for preferredCoverProvider field
    - Run `npx prisma migrate dev --name add_preferred_cover_provider`
    - Null default allows existing records to work unchanged
  - [x] 1.4 Ensure database layer tests pass
    - Run ONLY the 3 tests written in 1.1
    - Verify migration runs successfully

**Acceptance Criteria:**
- The 3 tests written in 1.1 pass
- Migration creates field without affecting existing data
- Prisma client regenerated with new field

---

### Type Definitions

#### Task Group 2: TypeScript Type Updates
**Dependencies:** Task Group 1

- [x] 2.0 Complete type definitions layer
  - [x] 2.1 Write 2 focused tests for type compatibility
    - Test that DashboardBookData type includes preferredCoverProvider
    - Test that EditBookModal book prop interface accepts preferredCoverProvider
  - [x] 2.2 Update DashboardBookData type in `src/types/dashboard.ts`
    - Add `preferredCoverProvider?: string | null` field
    - Maintain existing type structure
  - [x] 2.3 Update EditBookModal props interface in `src/components/modals/EditBookModal.tsx`
    - Add `preferredCoverProvider?: string | null` to book prop interface
    - Add optional `edition` prop for provider image data access
    - Include `hardcoverBook`, `googleBook`, `ibdbBook` with their `imageUrl` fields
  - [x] 2.4 Ensure type definition tests pass
    - Run ONLY the 2 tests written in 2.1
    - Verify TypeScript compilation succeeds

**Acceptance Criteria:**
- The 2 tests written in 2.1 pass
- TypeScript compilation passes with no errors
- Types are correctly exported and importable

---

### Utility and API Layer

#### Task Group 3: Utility Enhancement and API Endpoint
**Dependencies:** Task Group 2

- [x] 3.0 Complete utility and API layer
  - [x] 3.1 Write 5 focused tests for getCoverImageUrl and API endpoint
    - Test getCoverImageUrl returns preferred provider image when preferredProvider is set
    - Test getCoverImageUrl falls back to default order when preferred provider has no image
    - Test getCoverImageUrl maintains backward compatibility (no second param)
    - Test PATCH API accepts valid preferredCoverProvider values
    - Test PATCH API rejects invalid preferredCoverProvider values
  - [x] 3.2 Enhance getCoverImageUrl utility in `src/lib/utils/getCoverImageUrl.ts`
    - Add optional second parameter `preferredProvider?: string | null`
    - When `preferredProvider` is set and that provider has a valid imageUrl, return it first
    - Fall back to default order (Hardcover > Google > IBDB) if preferred provider has no image
    - Maintain backward compatibility for existing calls without the second parameter
  - [x] 3.3 Update PATCH `/api/user/books/[id]` in `src/app/api/user/books/[id]/route.ts`
    - Extract `preferredCoverProvider` from request body
    - Validate value is one of: 'hardcover', 'google', 'ibdb', or null
    - Add to updateData when provided
    - Follow existing pattern for conditional field updates
  - [x] 3.4 Update API query response to include preferredCoverProvider
    - Add `preferredCoverProvider` to the returned userBook data
    - Ensure field is included in final query response
  - [x] 3.5 Ensure utility and API tests pass
    - Run ONLY the 5 tests written in 3.1
    - Verify API returns correct data structure

**Acceptance Criteria:**
- The 5 tests written in 3.1 pass
- getCoverImageUrl respects preferred provider when set
- API correctly validates and persists preferredCoverProvider
- Backward compatibility maintained for existing code

---

### UI Layer

#### Task Group 4: Cover Tab UI Implementation
**Dependencies:** Task Group 3

- [x] 4.0 Complete UI layer
  - [x] 4.1 Write 6 focused tests for Cover tab UI components
    - Test Cover tab appears in EditBookModal tab navigation
    - Test Cover tab displays thumbnails from available providers
    - Test clicking thumbnail selects it as preferred cover
    - Test selected cover shows visual indicator (border highlight)
    - Test empty state displays when no covers available
    - Test preferredCoverProvider is included in form submission
  - [x] 4.2 Extend tab state and navigation in EditBookModal
    - Update activeTab useState type: `'basic' | 'tracking' | 'additional' | 'cover'`
    - Add fourth "Cover" tab button to nav element
    - Follow existing tab button styling pattern
  - [x] 4.3 Create Cover tab content section
    - Add conditional render block for `activeTab === 'cover'`
    - Display grid of cover image thumbnails
    - Show placeholder/empty state when no covers available from any provider
  - [x] 4.4 Implement cover selection state and handlers
    - Add `preferredCoverProvider` useState initialized from book prop
    - Create click handler to update selected provider
    - Highlight selected cover with visual indicator (border or ring)
  - [x] 4.5 Integrate preferredCoverProvider into form submission
    - Add `preferredCoverProvider` to handleSubmit request body
    - Include in JSON.stringify alongside existing fields
  - [x] 4.6 Update dashboard data flow to pass preferredCoverProvider
    - Update dashboard query in `src/app/dashboard/page.tsx` to include preferredCoverProvider
    - Pass preferredCoverProvider to getCoverImageUrl calls in BookCard component
    - Pass preferredCoverProvider to getCoverImageUrl calls in BookTable component
  - [x] 4.7 Ensure UI tests pass
    - Run ONLY the 6 tests written in 4.1
    - Verify cover selection works end-to-end

**Acceptance Criteria:**
- The 6 tests written in 4.1 pass
- Cover tab appears and functions correctly
- Cover selection persists and displays on dashboard
- Visual indicator clearly shows selected cover

---

### Testing

#### Task Group 5: Test Review and Gap Analysis
**Dependencies:** Task Groups 1-4

- [x] 5.0 Review existing tests and fill critical gaps only
  - [x] 5.1 Review tests from Task Groups 1-4
    - Review the 3 tests written in Task 1.1 (database layer)
    - Review the 2 tests written in Task 2.1 (type definitions)
    - Review the 5 tests written in Task 3.1 (utility and API)
    - Review the 6 tests written in Task 4.1 (UI layer)
    - Total existing tests: 16 tests
  - [x] 5.2 Analyze test coverage gaps for cover selection feature only
    - Identify critical user workflows that lack test coverage
    - Focus ONLY on gaps related to this spec's feature requirements
    - Prioritize end-to-end workflows over unit test gaps
  - [x] 5.3 Write up to 6 additional strategic tests maximum if necessary
    - Focus on integration between layers (e.g., UI -> API -> DB)
    - Test complete user journey: select cover -> save -> verify dashboard display
    - Test fallback behavior when preferred provider URL becomes invalid
    - Skip edge cases, performance tests unless business-critical
  - [x] 5.4 Run feature-specific tests only
    - Run ONLY tests related to cover selection feature (tests from 1.1, 2.1, 3.1, 4.1, and 5.3)
    - Expected total: approximately 16-22 tests maximum
    - Verify critical workflows pass

**Acceptance Criteria:**
- All feature-specific tests pass (approximately 16-22 tests total)
- Critical user workflows for cover selection are covered
- No more than 6 additional tests added when filling in testing gaps
- Testing focused exclusively on this spec's feature requirements

---

## Execution Order

Recommended implementation sequence:
1. **Database Layer** (Task Group 1) - Schema and migration first
2. **Type Definitions** (Task Group 2) - TypeScript types depend on schema
3. **Utility and API Layer** (Task Group 3) - Backend logic depends on types
4. **UI Layer** (Task Group 4) - Frontend depends on API
5. **Test Review and Gap Analysis** (Task Group 5) - Validate complete feature

## Key Files to Modify

| File | Changes |
|------|---------|
| `prisma/schema.prisma` | Add preferredCoverProvider field to UserBook |
| `src/types/dashboard.ts` | Add preferredCoverProvider to DashboardBookData |
| `src/lib/utils/getCoverImageUrl.ts` | Add preferredProvider parameter with fallback logic |
| `src/app/api/user/books/[id]/route.ts` | Handle preferredCoverProvider in PATCH endpoint |
| `src/components/modals/EditBookModal.tsx` | Add Cover tab, props, and selection UI |
| `src/app/dashboard/page.tsx` | Include preferredCoverProvider in query |
| `src/components/dashboard/BookCard.tsx` | Pass preferredCoverProvider to getCoverImageUrl |
| `src/components/dashboard/BookTable.tsx` | Pass preferredCoverProvider to getCoverImageUrl |

## Notes

- No visual assets provided; follow existing Tailwind styling patterns
- Cover tab always visible even with zero or one cover available (per requirements)
- No provider labels on cover thumbnails (per requirements)
- Fallback behavior is silent (no user notification needed)
