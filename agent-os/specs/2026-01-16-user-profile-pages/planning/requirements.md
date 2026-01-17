# Spec Requirements: User Profile Pages

## Initial Description

Create public user profile pages accessible at `/u/[username]` that display a user's shared reading activity including currently reading books and shared reviews.

## Requirements Discussion

### First Round Questions

**Q1:** URL structure - Should this be `/u/[username]`, `/user/[username]`, or `/profile/[username]`?
**Answer:** `/u/[username]`

**Q2:** Usernames - Should usernames be optional or required? How should users without usernames be handled?
**Answer:** Usernames should NOT be optional. A migration script already exists (`prisma/scripts/assign-default-usernames.ts`) to assign random usernames to existing users without one.

**Q3:** Statistics - Should the profile show reading statistics like "X books read this year"?
**Answer:** No statistics yet - exclude from this feature.

**Q4:** Currently reading display - What information should be shown for currently reading books (just covers, or also progress, etc.)?
**Answer:** Show all the details (title, author, progress, etc.)

**Q5:** Shared reviews - Should the profile show all of the user's shared reviews, or only recent ones?
**Answer:** Show ALL of the user's shared reviews on their profile.

**Q6:** Review display - Should reviews show full content or just preview with link to full share page?
**Answer:** Preview with a link to the full share page.

**Q7:** Visibility - Should profiles be entirely public, or only visible to logged-in users?
**Answer:** Entirely public (no auth required).

**Q8:** Privacy field - Should there be a new privacy field for profile visibility, or use existing "showCurrentlyReading" field?
**Answer:** No new field needed - only showing info they've already opted to share (showCurrentlyReading flag and SharedReview records).

**Q9:** Scope exclusions - Anything explicitly out of scope?
**Answer:** Just what was listed - no follower system, activity feed, stats charts, custom themes, etc.

**Q10:** Layout reference - How should books be displayed on the profile (similar to dashboard grid/table)?
**Answer:** Should show books the same way the dashboard does, including the grid/table selection toggle.

**Q11:** Mockups - Any design mockups or wireframes available?
**Answer:** No mockups provided.

### Existing Code to Reference

**Similar Features Identified:**
- Feature: Dashboard book display - Path: `src/components/dashboard/`
  - `DashboardClient.tsx` - Main client component with layout state management
  - `LayoutToggle.tsx` - Grid/table toggle component
  - `ViewSwitcher.tsx` - Switches between BookGrid and BookTable components
  - `BookGrid.tsx` - Grid layout for books
  - `BookTable.tsx` - Table layout for books
- Feature: Share page - Path: `src/app/share/reviews/[shareToken]/page.tsx`
  - Public review display with metadata generation
  - `PublicReviewDisplay.tsx` component
- Feature: Username migration script - Path: `prisma/scripts/assign-default-usernames.ts`
  - Generates `user${6-8 random digits}` format
  - Case-insensitive collision checking

**Database Schema References:**
- `User` model already has `username` (unique, optional), `showCurrentlyReading` (boolean), `bio` (optional)
- `SharedReview` model links users to their shared book reviews with visibility flags
- `UserBook` model contains all reading data with status, progress, dates

### Follow-up Questions

No follow-up questions needed. User provided comprehensive answers covering all aspects.

## Visual Assets

### Files Provided:
No visual assets provided.

### Visual Insights:
N/A - No visuals to analyze.

## Requirements Summary

### Functional Requirements
- Public profile page at `/u/[username]` accessible without authentication
- Display user's basic info (name, bio if set, profile picture)
- Show currently reading books when `showCurrentlyReading` is enabled
  - Include full details: title, author, cover, progress percentage, current page
- Display all shared reviews from the user
  - Show as preview cards with link to full share page (`/share/reviews/[shareToken]`)
- Grid/table layout toggle for book display (matching dashboard behavior)
- Handle 404 for non-existent usernames
- SEO metadata generation for profile pages

### Reusability Opportunities
- Reuse `LayoutToggle` component for grid/table switching
- Reuse `ViewSwitcher` component pattern for animated transitions
- Reuse `BookGrid`/`BookTable` components or create read-only variants
- Reference `PublicReviewDisplay` component styling for review preview cards
- Username validation logic from migration script for any future username editing

### Scope Boundaries

**In Scope:**
- Public profile page route at `/u/[username]`
- User info display (name, bio, profile picture)
- Currently reading section (when enabled via showCurrentlyReading flag)
- Shared reviews section with previews
- Grid/table layout toggle
- Server-side rendering for SEO
- 404 handling for invalid usernames

**Out of Scope:**
- Follower/following system
- Activity feed or timeline
- Statistics charts or reading analytics
- Custom profile themes or colors
- Profile editing UI (already exists in settings)
- Comments or social interactions on reviews
- Profile search or discovery features
- Private profiles or granular privacy controls

### Technical Considerations
- Username is currently optional in schema - migration script ensures all users have one
- Profile pages should be statically optimizable where possible
- Use existing `showCurrentlyReading` boolean to control currently reading visibility
- Use existing `SharedReview` model to determine which reviews to show
- Layout toggle state could be stored in localStorage for profile viewers (not persisted to DB)
- Consider ISR (Incremental Static Regeneration) for profile pages
- Shared review preview should respect the visibility flags (showDates, showBookClubs, etc.)
