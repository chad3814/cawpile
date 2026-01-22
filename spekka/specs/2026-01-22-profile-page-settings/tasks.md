# Task Breakdown: Profile Page Settings

## Overview
Total Tasks: 22
Feature: Add profile visibility controls and TBR display on public profile pages

## Task List

### Database Layer

#### Task Group 1: Schema and Migrations
**Dependencies:** None

- [x] 1.0 Complete database schema changes
  - [x] 1.1 Write 4 focused tests for new User fields
    - Test `profileEnabled` defaults to `false` for new users
    - Test `showTbr` defaults to `false` for new users
    - Test existing user migration sets `profileEnabled: true`
    - Test field types are boolean and nullable behavior
  - [x] 1.2 Add new fields to User model in Prisma schema
    - File: `/Users/cwalker/Projects/cawpile/main/prisma/schema.prisma`
    - Add `profileEnabled Boolean @default(false)` after `showCurrentlyReading` field (line 21)
    - Add `showTbr Boolean @default(false)` after `profileEnabled` field
    - Keep fields grouped with other profile-related booleans
  - [x] 1.3 Create migration with backwards compatibility
    - Run `npx prisma migrate dev --name add_profile_settings`
    - Migration must set `profileEnabled = true` for all existing users (backwards compatibility)
    - New users get `profileEnabled = false` (opt-in behavior)
    - `showTbr` defaults to `false` for all users (no backwards compatibility needed)
  - [x] 1.4 Verify migration runs successfully
    - Run `npx prisma generate` to update client types
    - Verify User type includes new fields via TypeScript
    - Test migration on development database

**Acceptance Criteria:**
- Migration runs without errors
- Existing users have `profileEnabled: true`
- New users default to `profileEnabled: false`
- Both fields are boolean type with proper defaults

### API Layer

#### Task Group 2: Settings API Updates
**Dependencies:** Task Group 1

- [x] 2.0 Complete API settings route updates
  - [x] 2.1 Write 4 focused tests for settings API
    - Test GET returns `profileEnabled` and `showTbr` fields
    - Test PATCH accepts and updates `profileEnabled` boolean
    - Test PATCH accepts and updates `showTbr` boolean
    - Test boolean coercion via `Boolean(value)` conversion
  - [x] 2.2 Update GET handler to include new fields
    - File: `/Users/cwalker/Projects/cawpile/main/src/app/api/user/settings/route.ts`
    - Add `profileEnabled` and `showTbr` to the `select` clause (lines 25-34)
    - Also add to the fallback select (lines 170-181) and update select (lines 189-198)
  - [x] 2.3 Update PATCH handler to accept new fields
    - Add `profileEnabled` and `showTbr` to destructured body (line 71)
    - Add type definitions to `updateData` object (lines 74-80)
    - Add validation blocks following `showCurrentlyReading` pattern (after line 165):
      ```typescript
      if (profileEnabled !== undefined) {
        updateData.profileEnabled = Boolean(profileEnabled)
      }
      if (showTbr !== undefined) {
        updateData.showTbr = Boolean(showTbr)
      }
      ```
  - [x] 2.4 Ensure API tests pass
    - Run tests for settings route only
    - Verify GET and PATCH work with new fields

**Acceptance Criteria:**
- GET `/api/user/settings` returns `profileEnabled` and `showTbr`
- PATCH accepts both fields and correctly coerces to boolean
- Existing functionality remains unchanged

#### Task Group 3: TBR Database Query
**Dependencies:** Task Group 1

- [x] 3.0 Complete TBR database query function
  - [x] 3.1 Write 4 focused tests for getProfileTbr
    - Test returns books with status `WANT_TO_READ`
    - Test orders by `createdAt` descending (newest first)
    - Test limits results to 5 books
    - Test returns total count alongside limited results
  - [x] 3.2 Create getProfileTbr.ts database query
    - File: `/Users/cwalker/Projects/cawpile/main/src/lib/db/getProfileTbr.ts`
    - Follow pattern from `getProfileCurrentlyReading.ts`
    - Query `UserBook` where `status: 'WANT_TO_READ'`
    - Include same relations: `edition.book`, `edition.googleBook`
    - Order by `createdAt: 'desc'` (most recently added first)
    - Limit via `take: 5`
    - Return object with `{ books: ProfileBookData[], totalCount: number }`
    - Use `prisma.userBook.count()` for total before applying limit
  - [x] 3.3 Export function from db module
    - Ensure function is exported and importable
  - [x] 3.4 Ensure TBR query tests pass
    - Run only tests for getProfileTbr function

**Acceptance Criteria:**
- Function returns up to 5 TBR books ordered by newest first
- Total count reflects all TBR books (not just limited 5)
- Uses same data structure as currently reading books

### Type Updates

#### Task Group 4: TypeScript Type Definitions
**Dependencies:** Task Groups 1, 3

- [x] 4.0 Complete type definition updates
  - [x] 4.1 Update ProfileUserData interface
    - File: `/Users/cwalker/Projects/cawpile/main/src/types/profile.ts`
    - Add `profileEnabled: boolean` after `showCurrentlyReading` (line 13)
    - Add `showTbr: boolean` after `profileEnabled`
  - [x] 4.2 Add TBR result type
    - Add interface in same file:
      ```typescript
      export interface ProfileTbrData {
        books: ProfileBookData[]
        totalCount: number
      }
      ```
  - [x] 4.3 Update ProfilePageData interface
    - Add `tbr?: ProfileTbrData` to ProfilePageData (line 98)
  - [x] 4.4 Update PreferencesData interface in PreferencesSection
    - File: `/Users/cwalker/Projects/cawpile/main/src/components/settings/PreferencesSection.tsx`
    - Add `profileEnabled: boolean` and `showTbr: boolean` to interface (lines 6-10)

**Acceptance Criteria:**
- TypeScript compiles without errors
- All new fields have proper types
- Types match API and database schema

### Profile Page Logic

#### Task Group 5: Profile Page Server Component
**Dependencies:** Task Groups 2, 3, 4

- [x] 5.0 Complete profile page server updates
  - [x] 5.1 Write 4 focused tests for profile page logic
    - Test returns 404 when user exists but `profileEnabled: false`
    - Test returns profile when `profileEnabled: true`
    - Test fetches TBR only when `showTbr: true`
    - Test passes correct TBR data structure to client component
  - [x] 5.2 Update getUserByUsername query
    - File: `/Users/cwalker/Projects/cawpile/main/src/lib/db/getUserProfile.ts`
    - Add `profileEnabled` and `showTbr` to select clause (line 16-24)
    - Add fields to return object (lines 31-39)
  - [x] 5.3 Add profileEnabled check to profile page
    - File: `/Users/cwalker/Projects/cawpile/main/src/app/u/[username]/page.tsx`
    - After user fetch (line 62), add check:
      ```typescript
      if (!user || !user.profileEnabled) {
        notFound()
      }
      ```
    - This makes disabled profiles return 404 as if user doesn't exist
  - [x] 5.4 Add TBR data fetching
    - Import `getProfileTbr` from `@/lib/db/getProfileTbr`
    - After currently reading fetch block (line 72), add:
      ```typescript
      let tbr: Awaited<ReturnType<typeof getProfileTbr>> | null = null
      if (user.showTbr) {
        tbr = await getProfileTbr(user.id)
      }
      ```
    - Pass `tbr` prop to `ProfilePageClient` component
  - [x] 5.5 Update generateMetadata for disabled profiles
    - Update metadata function to also check `profileEnabled` (after line 22)
    - Return noindex metadata if profile is disabled
  - [x] 5.6 Ensure profile page tests pass
    - Run only profile-related tests

**Acceptance Criteria:**
- Disabled profiles return 404 (not 403 or other status)
- TBR data only fetched when enabled
- SharedReviews via `/share/[token]` remain unaffected

### Frontend Components

#### Task Group 6: PreferencesSection UI
**Dependencies:** Task Group 4

- [x] 6.0 Complete preferences UI updates
  - [x] 6.1 Write 4 focused tests for PreferencesSection toggles
    - Test "Enable public profile" toggle renders and functions
    - Test "Show TBR" toggle renders and functions
    - Test both toggles submit via PATCH request
    - Test profile link mention in "Enable profile" description
  - [x] 6.2 Add state for new toggles
    - File: `/Users/cwalker/Projects/cawpile/main/src/components/settings/PreferencesSection.tsx`
    - Add useState hooks (after line 26):
      ```typescript
      const [profileEnabled, setProfileEnabled] = useState(data.profileEnabled)
      const [showTbr, setShowTbr] = useState(data.showTbr)
      ```
  - [x] 6.3 Update form submission
    - Add `profileEnabled` and `showTbr` to request body (lines 43-46)
    - Add fields to onUpdate callback (lines 55-58)
  - [x] 6.4 Add "Enable public profile" toggle UI
    - Insert before "Show currently reading" toggle (before line 104)
    - Use identical Switch component pattern
    - Label: "Enable public profile page"
    - Description: "When enabled, your profile will be visible at [profile link]. SharedReviews will continue to work even when your profile is disabled."
  - [x] 6.5 Add "Show TBR" toggle UI
    - Insert after "Show currently reading" toggle (after line 143)
    - Use identical Switch component pattern
    - Label: "Show my TBR books publicly"
    - Description: "When enabled, your want-to-read list will be visible on your public profile"
  - [x] 6.6 Ensure toggle tests pass
    - Run only PreferencesSection tests

**Acceptance Criteria:**
- Three profile toggles visually grouped together
- Enable profile toggle appears first
- Toggles use consistent styling with orange active state
- SharedReview note in description is clear

#### Task Group 7: ProfilePageClient TBR Section
**Dependencies:** Task Groups 4, 5

- [x] 7.0 Complete TBR section in ProfilePageClient
  - [x] 7.1 Write 4 focused tests for TBR section
    - Test TBR section renders when `showTbr: true` and books exist
    - Test TBR section hidden when `showTbr: false`
    - Test count display format "5 of 23 books"
    - Test section displays only cover, title, author (no dates, progress, ratings)
  - [x] 7.2 Update ProfilePageClient props interface
    - File: `/Users/cwalker/Projects/cawpile/main/src/components/profile/ProfilePageClient.tsx`
    - Import `ProfileTbrData` from types
    - Add `tbr: ProfileTbrData | null` to props interface (line 14)
  - [x] 7.3 Add TBR section rendering logic
    - Add content check (after line 49):
      ```typescript
      const hasTbr = user.showTbr && tbr && tbr.books.length > 0
      const hasEmptyTbr = user.showTbr && (!tbr || tbr.books.length === 0)
      ```
    - Update `hasNoContent` check to include TBR
  - [x] 7.4 Add TBR section JSX
    - Insert between Currently Reading section and Shared Reviews section (after line 79)
    - Use same section structure with h2 heading and mt-8 spacing
    - Include count display: `{tbr.books.length} of {tbr.totalCount} books` when totalCount > 5
    - No layout toggle (TBR displays minimal info)
  - [x] 7.5 Create TBR display component or reuse ProfileViewSwitcher
    - Option A: Create minimal `TbrBookList` component showing only cover, title, author
    - Option B: Create variant prop for `ProfileViewSwitcher` to hide dates/progress/ratings
    - TBR books display: cover image, title, authors only
    - Grid layout recommended (simple card display)
  - [x] 7.6 Ensure TBR section tests pass
    - Run only ProfilePageClient tests

**Acceptance Criteria:**
- TBR section appears between Currently Reading and Shared Reviews
- Shows only when user has `showTbr: true` and has TBR books
- Displays count text when total exceeds 5
- No dates, progress bars, or ratings shown for TBR books

### Testing

#### Task Group 8: Test Review and Gap Analysis
**Dependencies:** Task Groups 1-7

- [x] 8.0 Review existing tests and fill critical gaps only
  - [x] 8.1 Review tests from Task Groups 1-7
    - Review 4 tests from database layer (Task 1.1)
    - Review 4 tests from settings API (Task 2.1)
    - Review 4 tests from TBR query (Task 3.1)
    - Review 4 tests from profile page (Task 5.1)
    - Review 4 tests from PreferencesSection (Task 6.1)
    - Review 4 tests from ProfilePageClient (Task 7.1)
    - Total existing tests: approximately 24 tests
  - [x] 8.2 Analyze test coverage gaps for this feature only
    - Identify critical user workflows lacking coverage
    - Focus on end-to-end flow: settings change -> profile behavior
    - Verify SharedReview isolation from profile settings
  - [x] 8.3 Write up to 6 additional strategic tests maximum
    - Integration: Settings toggle -> Profile page visibility
    - Integration: TBR toggle -> TBR section appears/disappears
    - Edge case: User with no TBR books and `showTbr: true`
    - Edge case: Profile disabled with existing SharedReviews still accessible
    - Only add tests for critical gaps identified
  - [x] 8.4 Run feature-specific tests only
    - Run tests related to profile settings feature
    - Expected total: approximately 24-30 tests
    - Verify all critical workflows pass

**Acceptance Criteria:**
- All feature-specific tests pass
- Critical user workflows covered
- SharedReview isolation verified
- No more than 6 additional tests added

## Execution Order

Recommended implementation sequence:

1. **Database Layer** (Task Group 1)
   - Schema changes must be done first as all other work depends on new fields

2. **API Layer** (Task Groups 2-3) - Can run in parallel
   - Settings API updates (Group 2)
   - TBR database query (Group 3)

3. **Type Updates** (Task Group 4)
   - Required before frontend work to ensure type safety

4. **Profile Page Logic** (Task Group 5)
   - Server-side changes depend on types and database

5. **Frontend Components** (Task Groups 6-7) - Can run in parallel
   - PreferencesSection UI (Group 6)
   - ProfilePageClient TBR section (Group 7)

6. **Test Review** (Task Group 8)
   - Final validation after all implementation complete

## Key File References

| Purpose | File Path |
|---------|-----------|
| Prisma Schema | `/Users/cwalker/Projects/cawpile/main/prisma/schema.prisma` |
| Settings API | `/Users/cwalker/Projects/cawpile/main/src/app/api/user/settings/route.ts` |
| User Profile Query | `/Users/cwalker/Projects/cawpile/main/src/lib/db/getUserProfile.ts` |
| Currently Reading Query | `/Users/cwalker/Projects/cawpile/main/src/lib/db/getProfileCurrentlyReading.ts` |
| TBR Query | `/Users/cwalker/Projects/cawpile/main/src/lib/db/getProfileTbr.ts` |
| Profile Page | `/Users/cwalker/Projects/cawpile/main/src/app/u/[username]/page.tsx` |
| ProfilePageClient | `/Users/cwalker/Projects/cawpile/main/src/components/profile/ProfilePageClient.tsx` |
| PreferencesSection | `/Users/cwalker/Projects/cawpile/main/src/components/settings/PreferencesSection.tsx` |
| Profile Types | `/Users/cwalker/Projects/cawpile/main/src/types/profile.ts` |
| TBR Book Card | `/Users/cwalker/Projects/cawpile/main/src/components/profile/TbrBookCard.tsx` |
| TBR Section | `/Users/cwalker/Projects/cawpile/main/src/components/profile/TbrSection.tsx` |
| Settings Page | `/Users/cwalker/Projects/cawpile/main/src/app/settings/page.tsx` |
| Settings Client | `/Users/cwalker/Projects/cawpile/main/src/components/settings/SettingsClient.tsx` |

## Notes

- SharedReview routes (`/share/[token]`) must remain completely independent of profile settings
- Existing users get `profileEnabled: true` via migration for backwards compatibility
- New users default to `profileEnabled: false` (opt-in privacy approach)
- TBR section displays minimal information: cover, title, author only
- No pagination or "view more" for TBR section (limited to 5 books)
