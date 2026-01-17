# Specification: Profile Page Bug Fixes

## Goal
Fix two issues with the recently implemented profile pages: (1) add a clickable username link in the user menu dropdown that navigates to the user's public profile, and (2) make the layout toggle control both Currently Reading and Shared Reviews sections.

## User Stories
- As a user, I want to click my username in the dropdown menu to go directly to my public profile page so I can see what others see.
- As a user without a username, I want to be prompted to create one when clicking the profile link so I can access my profile page.
- As a visitor viewing a profile, I want both Currently Reading and Shared Reviews sections to respect the same layout toggle so the page displays consistently.

## Specific Requirements

**Clickable Username in User Menu**
- Make the username (or display name) in the UserMenu dropdown header a clickable link
- Link should navigate to `/u/[username]` when user has a username set
- The click area should be the name/username text, not the email
- Maintain existing styling while adding hover state for interactivity
- Close the dropdown menu after clicking the profile link

**Username Required Modal**
- Create `UsernameRequiredModal` component following the ReviewModal pattern
- Modal opens when user clicks profile link but has no username set
- Display clear message explaining why username is needed
- Include username input field with real-time availability checking
- Reuse `useUsernameCheck` hook for validation and availability
- Show validation states: checking spinner, available (green check), taken (red X)
- Save button calls `/api/user/settings` PATCH endpoint with username
- Navigate to `/u/[username]` after successful save
- Cancel button closes modal without action

**Fetch Username in UserMenu**
- UserMenu already fetches `/api/user/settings` for profilePictureUrl
- Extend UserData interface to include `username: string | null`
- Update fetch handler to extract username from settings response
- Use username to determine whether to show link or open modal

**Layout Toggle Shared State**
- Pass `layout` prop from ProfilePageClient to SharedReviewsSection
- SharedReviewsSection receives `layout: 'GRID' | 'TABLE'` prop
- Update SharedReviewsSection to conditionally render grid or table based on layout
- Layout toggle position remains above Currently Reading section

**SharedReviewsTable Component**
- Create new `SharedReviewsTable` component for table view of reviews
- Follow ProfileBookTable structure and styling patterns
- Columns: Cover thumbnail (48x64px), Title, Author(s), Rating (stars + numeric), Finish Date
- Use ProfileSharedReview type for data structure
- Include mobile-responsive layout similar to ProfileBookTable
- Each row links to `/share/reviews/[shareToken]` like the card version

**SharedReviewsViewSwitcher Component**
- Create component following ProfileViewSwitcher pattern
- Accept `reviews: ProfileSharedReview[]` and `layout: 'GRID' | 'TABLE'` props
- Animate transition between grid (SharedReviewsSection grid) and table (SharedReviewsTable)
- Use same animation timing (150ms delay, 300ms duration) as ProfileViewSwitcher

## Visual Design
No visual assets provided.

## Existing Code to Leverage

**`src/components/layout/UserMenu.tsx`**
- Dropdown menu structure with Link components for navigation
- Already fetches `/api/user/settings` for profile data
- Session data provides user name/email for display
- Pattern for closing menu on navigation click

**`src/components/modals/ReviewModal.tsx`**
- Headless UI Dialog with Transition components
- Modal header with close button pattern
- Loading state handling with disabled button
- Submit/Cancel button footer layout

**`src/hooks/useUsernameCheck.ts`**
- Debounced username availability checking
- Returns isChecking, isAvailable, message states
- Works with `/api/user/username-check` endpoint
- Can be reused directly in UsernameRequiredModal

**`src/components/profile/ProfileBookTable.tsx`**
- Table structure with mobile/desktop responsive layouts
- Cover thumbnail, title, authors, rating columns
- Date formatting utilities (formatEndingMonth)
- Star rating rendering with convertToStars

**`src/components/profile/ProfileViewSwitcher.tsx`**
- Animated view switching with opacity/translate transitions
- State management for animation timing
- Layout prop controls which view renders

## Out of Scope
- Moving the layout toggle to a different position
- Adding independent toggles per section
- Any other profile page enhancements beyond these two bug fixes
- Creating new API endpoints (all required endpoints exist)
- Modifying the username validation rules or API
- Adding new fields to the profile
- Changes to the Settings page username input
- Adding profile links elsewhere in the application
