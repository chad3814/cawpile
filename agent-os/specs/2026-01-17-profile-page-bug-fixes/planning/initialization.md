# Initialization

## Raw Idea

Fixing two bugs in the recently implemented profile pages:

1. **Add a profile link in the user menu (navigation)** - The user menu dropdown currently has Settings, Admin Panel (for admins), and Sign Out options, but no link to the user's public profile page.

2. **The grid/table layout toggle should apply to reviews as well as currently reading** - The layout toggle on profile pages currently only affects the "Currently Reading" section. It should also apply to the "Shared Reviews" section.

## Context

This is a Next.js 15 / React 19 app. The profile pages were just implemented at `/u/[username]`.

### Current Implementation Analysis

**User Menu (`src/components/layout/UserMenu.tsx`):**
- Dropdown menu with: Settings, Admin Panel (conditional), Sign Out
- No link to profile page exists
- Has access to session data including user info

**Profile Page (`src/components/profile/ProfilePageClient.tsx`):**
- Layout toggle state managed via `useState` with localStorage persistence
- LayoutToggle component only rendered in "Currently Reading" section
- SharedReviewsSection receives reviews but NOT the layout state

**SharedReviewsSection (`src/components/profile/SharedReviewsSection.tsx`):**
- Currently uses hardcoded grid layout: `grid grid-cols-1 md:grid-cols-2`
- No layout prop or toggle integration
- Uses SharedReviewCard component for each review

**ProfileViewSwitcher (`src/components/profile/ProfileViewSwitcher.tsx`):**
- Animated view switcher between Grid and Table views
- Currently only used for books (ProfileBookGrid/ProfileBookTable)
- Could potentially be reused for reviews

**Related Components:**
- ProfileBookGrid/ProfileBookTable - existing grid/table views for books
- SharedReviewCard - card component for reviews (current grid item)
- No SharedReviewTable component exists yet
