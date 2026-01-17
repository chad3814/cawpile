# Task Breakdown: Profile Page Bug Fixes

## Overview
Total Tasks: 14 (across 3 task groups)

This spec addresses two bugs:
1. **Bug 1**: Add clickable username in UserMenu that navigates to user's profile
2. **Bug 2**: Make layout toggle control both Currently Reading and Shared Reviews sections

## Task List

### User Menu Profile Link

#### Task Group 1: Clickable Username with Modal
**Dependencies:** None

- [x] 1.0 Complete user menu profile link feature
  - [x] 1.1 Update UserData interface and fetch in UserMenu
    - File: `src/components/layout/UserMenu.tsx`
    - Extend `UserData` interface to include `username: string | null`
    - Update fetch handler (line 43-47) to extract username from `/api/user/settings` response
    - Add state: `const [showUsernameModal, setShowUsernameModal] = useState(false)`
  - [x] 1.2 Create UsernameRequiredModal component
    - File: `src/components/modals/UsernameRequiredModal.tsx`
    - Follow `ReviewModal.tsx` pattern (Headless UI Dialog with Transition)
    - Props: `isOpen: boolean`, `onClose: () => void`, `onSuccess: (username: string) => void`
    - Include username input field with controlled state
    - Reuse `useUsernameCheck` hook from `src/hooks/useUsernameCheck.ts`
    - Display validation states: spinner (checking), green check (available), red X (taken)
    - Save button calls `PATCH /api/user/settings` with `{ username }`
    - On successful save, call `onSuccess(username)` callback
    - Cancel button calls `onClose()`
  - [x] 1.3 Make username clickable in UserMenu dropdown
    - File: `src/components/layout/UserMenu.tsx`
    - Convert username text (line 82) to clickable element with hover state
    - Add click handler that:
      - If `userData?.username` exists: navigate to `/u/${username}` and close menu
      - If no username: open `UsernameRequiredModal`
    - Add hover styles: `cursor-pointer hover:text-primary transition-colors`
    - Keep email (line 84) as non-clickable text
  - [x] 1.4 Wire up modal and navigation in UserMenu
    - File: `src/components/layout/UserMenu.tsx`
    - Import `UsernameRequiredModal` and `useRouter` from next/navigation
    - Add modal state management
    - On modal success: update `userData.username`, navigate to `/u/${username}`, close modal
    - Import and render `UsernameRequiredModal` at bottom of component
  - [ ] 1.5 Manual verification of user menu profile link
    - Test with user that has username: click navigates to `/u/[username]`
    - Test with user without username: click opens modal
    - Test modal: enter username, verify availability check works
    - Test modal save: successful save navigates to profile
    - Test modal cancel: closes without action
    - Verify dropdown closes after navigation

**Acceptance Criteria:**
- Username in dropdown header is clickable with hover state
- Users with username navigate directly to `/u/[username]`
- Users without username see modal prompting for username creation
- Modal shows real-time availability checking
- Successful username save navigates to profile
- Dropdown closes after profile link click or navigation

### Shared Reviews Layout Toggle

#### Task Group 2: Shared Reviews Table Component
**Dependencies:** None (can run in parallel with Task Group 1)

- [x] 2.0 Complete shared reviews table component
  - [x] 2.1 Create SharedReviewsTable component
    - File: `src/components/profile/SharedReviewsTable.tsx`
    - Follow `ProfileBookTable.tsx` structure and styling patterns
    - Props: `reviews: ProfileSharedReview[]`
    - Columns: Cover thumbnail (48x64px), Title, Author(s), Rating (stars + numeric), Finish Date
    - Import `ProfileSharedReview` from `@/types/profile`
    - Import `convertToStars` from `@/types/cawpile`
    - Each row is a Link to `/share/reviews/[shareToken]` (like SharedReviewCard)
    - Mobile layout: two-row grid with cover spanning rows (match ProfileBookTable pattern)
    - Desktop layout: horizontal table row with all columns visible
    - Handle null values gracefully (no rating shows '--', no date shows '--')
  - [x] 2.2 Implement rating and date formatting in SharedReviewsTable
    - File: `src/components/profile/SharedReviewsTable.tsx`
    - Add `formatFinishDate` function (match ProfileBookTable's `formatEndingMonth`)
    - Add `renderRating` function showing stars + numeric (e.g., "stars (7.5/10)")
    - Rating display matches SharedReviewCard: stars followed by `(average/10)`
  - [ ] 2.3 Manual verification of SharedReviewsTable
    - Verify table renders with correct columns
    - Verify mobile responsive layout works
    - Verify row click navigates to review page
    - Verify styling matches ProfileBookTable

**Acceptance Criteria:**
- SharedReviewsTable displays reviews in table format
- Columns show: Cover, Title, Authors, Rating (stars + numeric), Finish Date
- Mobile layout uses two-row grid pattern
- Each row links to `/share/reviews/[shareToken]`
- Styling matches ProfileBookTable

#### Task Group 3: Layout Toggle Integration
**Dependencies:** Task Group 2

- [x] 3.0 Complete layout toggle integration for reviews
  - [x] 3.1 Create SharedReviewsViewSwitcher component
    - File: `src/components/profile/SharedReviewsViewSwitcher.tsx`
    - Follow `ProfileViewSwitcher.tsx` pattern exactly
    - Props: `reviews: ProfileSharedReview[]`, `layout: 'GRID' | 'TABLE'`
    - Use same animation timing: 150ms delay, 300ms duration
    - Conditionally render:
      - GRID: existing grid layout (inline, copy from SharedReviewsSection)
      - TABLE: `SharedReviewsTable` component
    - Import SharedReviewCard for grid view, SharedReviewsTable for table view
  - [x] 3.2 Update SharedReviewsSection to accept layout prop
    - File: `src/components/profile/SharedReviewsSection.tsx`
    - Add `layout: 'GRID' | 'TABLE'` prop to interface
    - Replace inline grid div with `SharedReviewsViewSwitcher`
    - Pass `reviews` and `layout` props to view switcher
    - Keep section heading and empty state logic unchanged
  - [x] 3.3 Pass layout prop from ProfilePageClient to SharedReviewsSection
    - File: `src/components/profile/ProfilePageClient.tsx`
    - Update SharedReviewsSection usage (line 83) to pass `layout={layout}`
    - No other changes needed - layout state already exists
  - [ ] 3.4 Manual verification of layout toggle integration
    - Toggle layout on profile page
    - Verify Currently Reading section switches between grid/table
    - Verify Shared Reviews section switches between grid/table simultaneously
    - Verify animation timing matches between sections
    - Verify localStorage persistence works for both sections
    - Test with empty states (no books, no reviews)

**Acceptance Criteria:**
- SharedReviewsViewSwitcher animates between grid and table views
- SharedReviewsSection receives and uses layout prop
- Layout toggle affects both Currently Reading and Shared Reviews sections
- Animation timing (150ms delay, 300ms duration) matches ProfileViewSwitcher
- Layout preference persists via localStorage

## Execution Order

Recommended implementation sequence:

1. **Task Group 1: User Menu Profile Link** (Bug Fix 1)
   - 1.1 Update UserData interface and fetch
   - 1.2 Create UsernameRequiredModal
   - 1.3 Make username clickable
   - 1.4 Wire up modal and navigation
   - 1.5 Manual verification

2. **Task Group 2: Shared Reviews Table** (Bug Fix 2 - Part A)
   - 2.1 Create SharedReviewsTable component
   - 2.2 Implement rating and date formatting
   - 2.3 Manual verification

3. **Task Group 3: Layout Toggle Integration** (Bug Fix 2 - Part B)
   - 3.1 Create SharedReviewsViewSwitcher
   - 3.2 Update SharedReviewsSection
   - 3.3 Pass layout prop from ProfilePageClient
   - 3.4 Manual verification

**Note:** Task Groups 1 and 2 can be executed in parallel as they have no dependencies on each other. Task Group 3 depends on Task Group 2 completing first.

## Files to Create

| File | Description |
|------|-------------|
| `src/components/modals/UsernameRequiredModal.tsx` | Modal for username creation when user has no username |
| `src/components/profile/SharedReviewsTable.tsx` | Table view component for shared reviews |
| `src/components/profile/SharedReviewsViewSwitcher.tsx` | Animated view switcher for reviews section |

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/layout/UserMenu.tsx` | Add username to UserData, make name clickable, integrate modal |
| `src/components/profile/SharedReviewsSection.tsx` | Accept layout prop, use SharedReviewsViewSwitcher |
| `src/components/profile/ProfilePageClient.tsx` | Pass layout prop to SharedReviewsSection |

## Patterns to Follow

| Pattern | Source File | Usage |
|---------|-------------|-------|
| Modal with Dialog/Transition | `src/components/modals/ReviewModal.tsx` | UsernameRequiredModal structure |
| Username validation hook | `src/hooks/useUsernameCheck.ts` | Availability checking in modal |
| Table component structure | `src/components/profile/ProfileBookTable.tsx` | SharedReviewsTable layout |
| View switcher animation | `src/components/profile/ProfileViewSwitcher.tsx` | SharedReviewsViewSwitcher |
| Rating display | `src/components/profile/SharedReviewCard.tsx` | Stars + numeric format |
