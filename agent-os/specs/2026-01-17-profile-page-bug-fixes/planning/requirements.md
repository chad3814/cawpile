# Spec Requirements: Profile Page Bug Fixes

## Initial Description
Fixing two bugs in the recently implemented profile pages:

1. **Add a profile link in the user menu (navigation)** - The user menu dropdown currently has Settings, Admin Panel (for admins), and Sign Out options, but no link to the user's public profile page.

2. **The grid/table layout toggle should apply to reviews as well as currently reading** - The layout toggle on profile pages currently only affects the "Currently Reading" section. It should also apply to the "Shared Reviews" section.

## Requirements Discussion

### First Round Questions

**Q1:** Profile link label - Should the menu item say "Profile", "My Profile", "View Profile", or match the username (e.g., "@username")?
**Answer:** Make the username itself the link (clickable username that goes to profile)

**Q2:** What should happen if a user doesn't have a username set yet? Should clicking the profile link redirect to settings, show an error, or prompt them to create a username?
**Answer:** Add a modal to require users to pick a username if one isn't set

**Q3:** For the layout toggle on reviews, should both sections (Currently Reading and Shared Reviews) share the same toggle state, or have independent toggles?
**Answer:** Single shared state for both sections, just like the dashboard

**Q4:** The reviews table view - what columns should appear? Suggested: Cover thumbnail, Title, Author(s), Rating (stars), Finish Date, Share Link. What would you like?
**Answer:** Cover thumbnail, Title, Author(s), Rating (stars + numeric), Finish Date

**Q5:** Should the layout toggle be moved to a more prominent position (like next to the profile header) since it now affects multiple sections, or stay in its current position above Currently Reading?
**Answer:** Keep in current position (above Currently Reading)

**Q6:** Are there any other profile page issues or enhancements you want to exclude from this scope?
**Answer:** Just what was listed above (the two bug fixes)

**Q7:** Visual assets - Do you have any design mockups, wireframes, or screenshots that could help guide the development?
**Answer:** No visual assets provided

### Existing Code to Reference

**Similar Features Identified:**
- Feature: UserMenu - Path: `src/components/layout/UserMenu.tsx`
  - Dropdown menu with Link components for navigation
  - Uses session data to show user info
  - Conditional rendering for admin-only items
- Feature: Modal Pattern - Path: `src/components/modals/ReviewModal.tsx`
  - Headless UI Dialog with transitions
  - Form submission pattern with loading states
- Feature: ProfilePageClient - Path: `src/components/profile/ProfilePageClient.tsx`
  - Layout toggle state management with localStorage
  - Single state variable controlling section layout
- Feature: ProfileBookTable - Path: `src/components/profile/ProfileBookTable.tsx`
  - Table view pattern for profile books
  - Column structure: Cover, Title, Authors, Status, Rating, Progress/Date
- Feature: ProfileViewSwitcher - Path: `src/components/profile/ProfileViewSwitcher.tsx`
  - Animated view switching between Grid and Table
  - Accepts `layout` prop from parent

## Visual Assets

### Files Provided:
No visual assets provided.

### Visual Insights:
N/A

## Requirements Summary

### Functional Requirements

**Bug Fix 1: Profile Link in User Menu**
- Make the username displayed in the user menu clickable
- The username should link to the user's public profile at `/u/[username]`
- If user has no username set, clicking should open a modal to require username creation
- Username creation modal should:
  - Prompt user to enter a username
  - Validate username (format, availability)
  - Save username and then navigate to profile
- The username display area in the dropdown header should become the clickable link

**Bug Fix 2: Shared Layout Toggle for Reviews**
- Pass the existing layout state from ProfilePageClient to SharedReviewsSection
- Create a new SharedReviewsTable component for table view display
- Create a new SharedReviewsViewSwitcher component (similar to ProfileViewSwitcher)
- Table columns: Cover thumbnail, Title, Author(s), Rating (stars + numeric), Finish Date
- Both Currently Reading and Shared Reviews sections use the same layout preference
- Layout toggle remains in its current position (above Currently Reading)
- Toggle affects both sections simultaneously

### Reusability Opportunities
- Modal pattern from `ReviewModal.tsx` for username requirement modal
- Headless UI Dialog with transitions
- Table structure from `ProfileBookTable.tsx` for SharedReviewsTable
- View switching animation from `ProfileViewSwitcher.tsx` for SharedReviewsViewSwitcher
- Username validation logic may exist in settings (ProfileSection)

### Scope Boundaries

**In Scope:**
- Adding clickable username in user menu dropdown
- Username requirement modal when username is not set
- Passing layout state to SharedReviewsSection
- Creating SharedReviewsTable component
- Creating SharedReviewsViewSwitcher component (optional - could reuse pattern)

**Out of Scope:**
- Moving the layout toggle position
- Adding independent toggles per section
- Any other profile page enhancements
- Username validation API (if not already existing)

### Technical Considerations
- UserMenu currently fetches user settings via `/api/user/settings` - username already available
- ProfileSharedReview type has all necessary data for table: cover, title, authors, rating (average), finishDate
- Layout toggle already uses localStorage with key 'profile-view-layout'
- Modal should use existing Headless UI Dialog pattern
- Username validation endpoint may need to be created (check if exists)
- Navigation to profile requires username - modal blocks until username is set
