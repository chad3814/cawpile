# Task Breakdown: User Profile Pages

## Overview
Total Tasks: 27 tasks across 5 task groups

This feature creates public user profile pages at `/u/[username]` displaying a user's shared reading activity, including currently reading books (when enabled) and shared reviews.

## Task List

### Foundation Layer

#### Task Group 1: Types and Data Layer
**Dependencies:** None

- [x] 1.0 Complete types and data layer
  - [x] 1.1 Create shared types for profile page data
    - Create `src/types/profile.ts` with interfaces for:
      - `ProfileUserData` (name, username, bio, profilePictureUrl, image, showCurrentlyReading)
      - `ProfileBookData` extending dashboard `BookData` pattern
      - `ProfileSharedReview` (preview card data with visibility flags)
    - Reuse `BookData` interface pattern from `src/components/dashboard/ViewSwitcher.tsx`
  - [x] 1.2 Create data fetching utility for profile data
    - Create `src/lib/db/getUserProfile.ts` with:
      - `getUserByUsername(username: string)` function with case-insensitive lookup
      - Use Prisma `mode: 'insensitive'` for username query
      - Include user fields: name, username, bio, profilePictureUrl, image, showCurrentlyReading
    - Return `null` for non-existent users to trigger 404
  - [x] 1.3 Create data fetching utility for currently reading books
    - Create `src/lib/db/getProfileCurrentlyReading.ts` with:
      - `getProfileCurrentlyReading(userId: string)` function
      - Query `UserBook` where `status: 'READING'`
      - Include relations: edition, book, googleBook, cawpileRating
      - Match query pattern from dashboard page.tsx
  - [x] 1.4 Create data fetching utility for shared reviews
    - Create `src/lib/db/getProfileSharedReviews.ts` with:
      - `getProfileSharedReviews(userId: string)` function
      - Query `SharedReview` where `userId` matches
      - Include userBook with edition, book, googleBook, cawpileRating
      - Order by `createdAt: 'desc'` for most recent first
      - Include visibility flags (showDates, showBookClubs, showReadathons, showReview)

**Acceptance Criteria:**
- Types compile without errors
- All three data fetching functions export correctly
- Case-insensitive username lookup verified

---

### API Layer

#### Task Group 2: API Endpoint
**Dependencies:** Task Group 1

- [x] 2.0 Complete API layer
  - [x] 2.1 Create public profile API endpoint
    - Create `src/app/api/profile/[username]/route.ts`
    - Implement `GET` handler (no auth required - public endpoint)
    - Use `getUserByUsername()` from Task 1.2
    - Return 404 JSON response for non-existent username
    - Return user profile data, currently reading (if enabled), and shared reviews
  - [x] 2.2 Add response formatting and error handling
    - Format response as JSON with proper structure
    - Include `currentlyReading: []` array (empty if disabled or no books)
    - Include `sharedReviews: []` array
    - Add proper HTTP status codes (200, 404, 500)
    - Handle edge cases: user exists but has no shared content

**Acceptance Criteria:**
- API returns 404 for non-existent username
- API returns correct data structure for valid username
- Currently reading respects `showCurrentlyReading` flag
- No authentication required for access

---

### UI Components Layer

#### Task Group 3: Profile Page Components
**Dependencies:** Task Groups 1-2

- [x] 3.0 Complete profile page UI components
  - [x] 3.1 Create profile header component
    - Create `src/components/profile/ProfileHeader.tsx`
    - Display profile picture (use profilePictureUrl with fallback to OAuth image)
    - Show user name prominently with `@username` subtitle
    - Display bio text when present (max 500 chars, already enforced)
    - Use similar styling to share page header pattern
  - [x] 3.2 Create read-only book card component for profile
    - Create `src/components/profile/ProfileBookCard.tsx`
    - Adapt from `src/components/dashboard/BookCard.tsx`
    - Remove all interactive elements: menus, modals, edit buttons
    - Keep: cover image, title, authors, star rating badge, progress bar (for reading)
    - Keep: status badge, format icons, tracking badges
    - Remove: click handlers, router usage, state management
  - [x] 3.3 Create read-only book grid component for profile
    - Create `src/components/profile/ProfileBookGrid.tsx`
    - Adapt from `src/components/dashboard/BookGrid.tsx`
    - Use `ProfileBookCard` instead of `BookCard`
    - Remove section headers (no "Currently Reading" / "Library" split)
    - Display all books in single grid layout
  - [x] 3.4 Create read-only book table component for profile
    - Create `src/components/profile/ProfileBookTable.tsx`
    - Adapt from `src/components/dashboard/BookTable.tsx`
    - Remove row click navigation (`handleRowClick`)
    - Remove router usage
    - Keep responsive mobile/desktop layouts
    - Display all books without section headers
  - [x] 3.5 Create profile view switcher component
    - Create `src/components/profile/ProfileViewSwitcher.tsx`
    - Adapt from `src/components/dashboard/ViewSwitcher.tsx`
    - Use `ProfileBookGrid` and `ProfileBookTable` instead of dashboard versions
    - Keep animation behavior
  - [x] 3.6 Create shared review preview card component
    - Create `src/components/profile/SharedReviewCard.tsx`
    - Display: book cover, title, authors, star rating
    - Link to full review page: `/share/reviews/[shareToken]`
    - Respect visibility flags in preview (show/hide dates, clubs, readathons)
    - Use styling consistent with `PublicReviewDisplay.tsx` card pattern
  - [x] 3.7 Create shared reviews section component
    - Create `src/components/profile/SharedReviewsSection.tsx`
    - Grid layout of `SharedReviewCard` components
    - Section heading: "Shared Reviews"
    - Handle empty state with appropriate message
  - [x] 3.8 Create profile empty states
    - Create `src/components/profile/ProfileEmptyState.tsx`
    - Variants for:
      - No currently reading books (when section enabled but empty)
      - No shared reviews
      - Profile has no public content at all
    - Use consistent styling with `EmptyLibrary.tsx` but read-only (no CTAs)

**Acceptance Criteria:**
- All components render without errors
- No interactive/edit functionality exposed on public profile
- Components visually match dashboard patterns
- Review cards link to correct share pages

---

### Page Layer

#### Task Group 4: Profile Page Route
**Dependencies:** Task Groups 1-3

- [x] 4.0 Complete profile page route
  - [x] 4.1 Create profile page server component
    - Create `src/app/u/[username]/page.tsx`
    - Server component with async data fetching
    - Use `params` with `Promise<{ username: string }>` pattern (Next.js 15)
    - Fetch user profile using `getUserByUsername()`
    - Call `notFound()` for non-existent username
    - Fetch currently reading books (if `showCurrentlyReading` is true)
    - Fetch shared reviews
  - [x] 4.2 Create profile page client component
    - Create `src/components/profile/ProfilePageClient.tsx`
    - Accept props: user data, currently reading books, shared reviews
    - Manage layout toggle state with `useState`
    - Store layout preference in `localStorage` (key: `profile-view-layout`)
    - Default to `'GRID'` layout for new visitors
    - Load from localStorage on mount with `useEffect`
  - [x] 4.3 Implement SEO metadata generation
    - Add `generateMetadata()` function to page.tsx
    - Title format: `[Name]'s Profile | Cawpile` (fallback to username if no name)
    - Include Open Graph tags for social sharing
    - Add `robots: 'index, follow'` for public discoverability
    - Description: `[Name]'s reading profile on Cawpile` or bio excerpt
    - Handle non-existent user gracefully (noindex for 404)
  - [x] 4.4 Integrate all components into page layout
    - Render `ProfileHeader` at top
    - Section: Currently Reading with `LayoutToggle` and `ProfileViewSwitcher`
      - Only show when `showCurrentlyReading` is true AND has books
      - Show empty state when enabled but no books
    - Section: Shared Reviews with `SharedReviewsSection`
      - Show empty state when no shared reviews
    - Footer with "Powered by Cawpile" like share page
  - [x] 4.5 Create custom 404 page for profile routes
    - Create `src/app/u/[username]/not-found.tsx`
    - Display friendly message: "Profile not found"
    - Suggest checking the username
    - Link back to home page

**Acceptance Criteria:**
- Page renders correctly for valid usernames
- 404 page shows for invalid usernames
- SEO metadata generates correctly
- Layout toggle persists in localStorage
- All sections display conditionally based on data

---

### Polish Layer

#### Task Group 5: Error Handling and Edge Cases
**Dependencies:** Task Groups 1-4

- [x] 5.0 Complete error handling and polish
  - [x] 5.1 Handle loading and error states
    - Add loading skeleton while client hydrates (layout toggle)
    - Handle API errors gracefully in server component
    - Ensure page works with JavaScript disabled (SSR content)
  - [x] 5.2 Add responsive design verification
    - Verify mobile layout (320px - 768px)
    - Verify tablet layout (768px - 1024px)
    - Verify desktop layout (1024px+)
    - Ensure profile header scales appropriately
    - Ensure grid/table views adapt to screen size
  - [x] 5.3 Verify accessibility
    - Add proper heading hierarchy (h1 for name, h2 for sections)
    - Ensure layout toggle has proper aria labels
    - Verify link focus states on review cards
    - Ensure images have alt text
  - [x] 5.4 Test edge cases
    - User with no bio
    - User with no profile picture (fallback to OAuth image)
    - User with no OAuth image (show initials or placeholder)
    - User with showCurrentlyReading false (section hidden)
    - User with showCurrentlyReading true but no reading books
    - User with no shared reviews
    - User with no public content at all (both sections empty)
  - [x] 5.5 Update settings page copy
    - Modify `src/components/settings/PreferencesSection.tsx`
    - Update text "(public profiles coming soon)" to indicate feature is live
    - Optionally add link to user's own profile page

**Acceptance Criteria:**
- Page handles all edge cases gracefully
- Responsive design works across all breakpoints
- Accessibility standards met
- Settings page reflects feature availability

---

## Execution Order

Recommended implementation sequence:
1. **Foundation Layer** (Task Group 1) - Types and data fetching
2. **API Layer** (Task Group 2) - Public endpoint
3. **UI Components Layer** (Task Group 3) - All profile components
4. **Page Layer** (Task Group 4) - Route and integration
5. **Polish Layer** (Task Group 5) - Error handling and verification

## Files to Create

### New Files
| File Path | Purpose |
|-----------|---------|
| `src/types/profile.ts` | Type definitions for profile data |
| `src/lib/db/getUserProfile.ts` | User lookup by username |
| `src/lib/db/getProfileCurrentlyReading.ts` | Currently reading books query |
| `src/lib/db/getProfileSharedReviews.ts` | Shared reviews query |
| `src/app/api/profile/[username]/route.ts` | Public profile API endpoint |
| `src/app/u/[username]/page.tsx` | Profile page route |
| `src/app/u/[username]/not-found.tsx` | Custom 404 for profiles |
| `src/components/profile/ProfileHeader.tsx` | User info header |
| `src/components/profile/ProfileBookCard.tsx` | Read-only book card |
| `src/components/profile/ProfileBookGrid.tsx` | Read-only book grid |
| `src/components/profile/ProfileBookTable.tsx` | Read-only book table |
| `src/components/profile/ProfileViewSwitcher.tsx` | Grid/table switcher |
| `src/components/profile/ProfilePageClient.tsx` | Client component wrapper |
| `src/components/profile/SharedReviewCard.tsx` | Review preview card |
| `src/components/profile/SharedReviewsSection.tsx` | Reviews section |
| `src/components/profile/ProfileEmptyState.tsx` | Empty state variants |

### Files to Modify
| File Path | Change |
|-----------|--------|
| `src/components/settings/PreferencesSection.tsx` | Update "coming soon" text |

## Key Patterns to Follow

1. **Server Component Pattern** - Follow `src/app/share/reviews/[shareToken]/page.tsx` for server-side data fetching and metadata generation

2. **BookData Interface** - Reuse the interface from `src/components/dashboard/ViewSwitcher.tsx` for book data shape

3. **Layout Toggle Pattern** - Follow `src/components/dashboard/LayoutToggle.tsx` but store in localStorage instead of database

4. **Public Page Styling** - Follow `src/components/share/PublicReviewDisplay.tsx` for card styling and layout

5. **Case-Insensitive Query** - Use Prisma's `mode: 'insensitive'` for username lookups:
   ```typescript
   prisma.user.findFirst({
     where: { username: { equals: username, mode: 'insensitive' } }
   })
   ```
