# Specification: Profile Page Settings

## Goal
Add two new profile page settings: a master toggle to enable/disable the public profile page entirely, and a toggle to show Want To Read (TBR) books on the profile.

## User Stories
- As a privacy-conscious user, I want to disable my public profile page so that visiting `/u/[username]` returns a 404 as if I don't exist
- As a reader who wants to share my reading list, I want to optionally show my TBR books on my profile so others can see what I plan to read

## Specific Requirements

**Profile Enabled/Disabled Toggle**
- Add `profileEnabled` boolean field to User model in Prisma schema
- Default value: `false` for new users (opt-in to enable profile)
- When disabled, `/u/[username]` page returns 404 via `notFound()`
- SharedReviews via `/share/[token]` continue to work regardless of profile setting
- Existing users need a migration that sets `profileEnabled: true` for backwards compatibility

**Show TBR on Profile Toggle**
- Add `showTbr` boolean field to User model in Prisma schema
- Default value: `false` (opt-in to show TBR)
- Only effective when `profileEnabled` is true
- Follow exact pattern of existing `showCurrentlyReading` toggle

**PreferencesSection UI Updates**
- Add toggle for "Enable public profile page" above existing "Show currently reading" toggle
- Add toggle for "Show my TBR books publicly" below "Show currently reading" toggle
- Both new toggles use same Headless UI Switch component pattern
- Profile-related toggles should be visually grouped together
- "Enable public profile" toggle description should mention that SharedReviews still work when disabled

**API Settings Route Updates**
- Update `/api/user/settings` GET to include `profileEnabled` and `showTbr` fields
- Update `/api/user/settings` PATCH to accept and validate both boolean fields
- Follow existing validation pattern: `Boolean(value)` conversion

**Profile Page Server Component Updates**
- Check `profileEnabled` flag in `getUserByUsername` query result
- Return `notFound()` if user exists but `profileEnabled` is false
- Conditionally fetch TBR books similar to `currentlyReading` pattern
- Pass TBR data to `ProfilePageClient` component

**TBR Database Query**
- Create `getProfileTbr.ts` in `src/lib/db/` following `getProfileCurrentlyReading.ts` pattern
- Query `UserBook` where `status: 'WANT_TO_READ'`
- Order by `createdAt: 'desc'` (most recently added first)
- Limit to 5 books
- Return total count alongside limited results for display

**ProfilePageClient TBR Section**
- Add TBR section between Currently Reading and Shared Reviews sections
- Display section only when `showTbr` is true and user has TBR books
- Show book cover, title, and author only (no dates, no progress, no ratings)
- Display count text: "5 of 23 books" format when total exceeds 5
- No "view more" link or pagination
- Reuse `ProfileViewSwitcher` component or create minimal variant

**Type Updates**
- Add `profileEnabled` and `showTbr` to `ProfileUserData` interface
- TBR books can reuse `ProfileBookData` type (subset of fields displayed)

## Existing Code to Leverage

**PreferencesSection.tsx Toggle Pattern**
- Uses Headless UI `Switch` component with orange active state
- State managed via `useState` hook synchronized with API
- Submit via `/api/user/settings` PATCH endpoint
- Shows link to profile page in description text

**getProfileCurrentlyReading.ts Query Pattern**
- Queries `UserBook` with status filter and user ID
- Includes `edition.book` and `edition.googleBook` relations
- Maps results to `ProfileBookData` type
- TBR query should follow identical structure with different status filter and limit

**getUserByUsername.ts Query Pattern**
- Case-insensitive username lookup via Prisma `mode: 'insensitive'`
- Select specific fields for `ProfileUserData` type
- Returns null to trigger 404 in page component
- Add `profileEnabled` and `showTbr` to select clause

**Profile Page Server Component Pattern**
- Fetches user first, returns `notFound()` if null
- Conditionally fetches additional data based on user settings
- Passes all data to client component for rendering

**ProfilePageClient Section Layout**
- Uses consistent section structure with h2 heading and mt-8 spacing
- Layout toggle shown when section has content
- Empty state component for sections with no data

## Out of Scope
- Modifications to SharedReview functionality or `/share/[token]` routes
- "View more" functionality or pagination for TBR section
- Social/follow features
- Changes to existing Currently Reading toggle behavior
- Profile analytics or view counts
- Custom privacy settings per TBR book
- Sorting options for TBR display
- TBR book removal from profile page
- Date added display for TBR books
- Profile page caching changes
