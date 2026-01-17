# Specification: User Profile Pages

## Goal

Create public user profile pages at `/u/[username]` that display a user's shared reading activity, including currently reading books (when enabled) and all shared reviews, providing a public-facing view of their Cawpile reading journey.

## User Stories

- As a reader, I want to share my reading profile with friends so that they can see what I'm currently reading and my book reviews
- As a visitor, I want to view another reader's profile without needing to sign up so that I can discover their book recommendations

## Specific Requirements

**Profile URL Structure**
- Route: `/u/[username]` using Next.js App Router dynamic segments
- Username lookup should be case-insensitive to handle URL variations
- Return 404 page for non-existent usernames using Next.js `notFound()`
- Server-side render for SEO with proper metadata generation

**User Information Display**
- Show profile picture using `profilePictureUrl` field, with fallback to OAuth `image`
- Display user's name (from `name` field) prominently
- Show bio text when present (from `bio` field, max 500 chars)
- Include username in a subtle secondary position (e.g., "@username")
- No edit capabilities on this public view

**Currently Reading Section**
- Only display when user's `showCurrentlyReading` preference is `true`
- Query `UserBook` records with `status: 'READING'` for this user
- Include full book details: cover image, title, authors, progress percentage, current page
- Reuse the dashboard's grid/table pattern with `ViewSwitcher` component adaptation

**Layout Toggle for Books**
- Implement grid/table toggle matching dashboard behavior
- Store layout preference in localStorage (not database - visitor preference)
- Default to GRID layout for new visitors
- Reuse `LayoutToggle` component from dashboard

**Shared Reviews Section**
- Query all `SharedReview` records for the user
- Display as preview cards with book cover, title, authors, star rating
- Each card links to the full review page at `/share/reviews/[shareToken]`
- Respect visibility flags from SharedReview (showDates, showBookClubs, etc.) in preview
- Sort by most recently created first

**SEO Metadata**
- Generate dynamic metadata with user's name and book count
- Include Open Graph tags for social sharing
- Use `robots: 'index, follow'` for public discoverability
- Page title format: "[Name]'s Profile | Cawpile"

**Error States**
- 404 page for non-existent username with helpful message
- Empty state for profile with no currently reading books (when enabled but empty)
- Empty state for profile with no shared reviews
- Handle edge case of user with no username (should not occur after migration)

## Existing Code to Leverage

**Dashboard Book Display Components**
- `src/components/dashboard/ViewSwitcher.tsx` - Animated transition between grid and table views
- `src/components/dashboard/BookGrid.tsx` - Grid layout with BookCard components
- `src/components/dashboard/BookTable.tsx` - Table layout with row click navigation
- `src/components/dashboard/LayoutToggle.tsx` - Grid/table toggle buttons
- Create read-only variants that remove click-to-edit behavior for public profile

**Share Page Pattern**
- `src/app/share/reviews/[shareToken]/page.tsx` - Pattern for public page with metadata generation
- `src/components/share/PublicReviewDisplay.tsx` - Card styling and layout for book reviews
- Use similar structure for profile page server component and data fetching

**Settings Profile Fields**
- `src/components/settings/ProfileSection.tsx` - Shows which user fields exist (name, username, bio, profilePictureUrl)
- `src/components/settings/PreferencesSection.tsx` - Shows `showCurrentlyReading` toggle already exists
- No changes needed to settings; profile page is read-only consumer

**BookData Type Pattern**
- Both `BookGrid` and `BookTable` use same `BookData` interface for book display
- Include edition, googleBook, cawpileRating relations in query
- Reuse this type definition for profile page data fetching

## Out of Scope

- Follower/following system or social connections between users
- Activity feed or timeline of reading activity
- Statistics charts or reading analytics on profile
- Custom profile themes, colors, or banner images
- Profile editing from the profile page (use existing settings page)
- Comments or reactions on reviews from profile
- Profile search or user discovery features
- Private profiles or additional granular privacy controls beyond existing flags
- Making username required at database level (handled by migration script)
- Email or contact information display
