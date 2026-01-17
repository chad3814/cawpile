# Specification: User Settings Page

## Goal
Create a dedicated `/settings` page allowing users to manage their profile information (name, username, bio, profile picture), reading preferences (annual goal, public visibility toggle), and account actions (hard delete).

## User Stories
- As a user, I want to customize my profile (name, username, bio, avatar) so that my identity is personalized for future public profile features
- As a user, I want to set my annual reading goal so that my dashboard shows accurate progress tracking
- As a user, I want to permanently delete my account and all associated data so that I can remove my presence from the platform

## Specific Requirements

**Settings Page Structure**
- Create dedicated page at `/settings` route (not a modal)
- Organize into three collapsible/tabbed sections: Profile, Preferences, Account
- Server component for initial data fetch with client components for interactive forms
- Add "Settings" link to UserMenu dropdown that navigates to `/settings`
- Protected route requiring authentication (redirect unauthenticated users to signin)

**Profile Section - Name Field**
- Editable text input for display name
- Optional field (can be blank)
- Max 255 characters
- Pre-populated from existing `User.name` value

**Profile Section - Username Field**
- Required text input for unique username
- Case-insensitive uniqueness validation (store lowercase, display as entered)
- Allowed characters: alphanumeric, hyphen, underscore only (regex: `^[a-zA-Z0-9_-]+$`)
- Max 128 characters
- Real-time availability check with debounced API call
- Display validation errors inline (taken, invalid characters, too long)

**Profile Section - Bio Field**
- Optional textarea for user bio/description
- Max 500 characters with character counter
- Plain text only (no HTML/markdown rendering)

**Profile Section - Profile Picture Upload**
- File input accepting image types (jpg, png, gif, webp)
- Max file size 5MB with client-side validation
- Upload to S3 bucket `cawpile-avatars` via presigned URL
- Server-side resizing to 200x200 pixels using sharp library
- Store S3 URL in new `profilePictureUrl` field on User model
- Display current avatar with "Change" and "Remove" options
- Fallback to Google OAuth image if no custom picture set

**Preferences Section - Reading Goal**
- Number input for annual reading goal
- Min 1, max 500, default 12
- Update existing `User.readingGoal` field
- Dashboard should use this value instead of hardcoded 12

**Preferences Section - Public Currently Reading Toggle**
- Boolean toggle switch
- Stores preference flag for future public profile feature
- New `showCurrentlyReading` field on User model, default false
- Label: "Show my currently reading books publicly"

**Account Section - Delete Account**
- Danger zone with red styling to indicate destructive action
- Requires confirmation modal with typed confirmation (e.g., type "DELETE")
- Hard delete cascading through all user data
- Sign out user and redirect to home page after deletion
- Display warning listing data that will be deleted

**Database Migration - Default Usernames**
- Create migration script to assign `user${randomNumber}` to existing users without username
- Random number should be 6-8 digits to minimize collisions
- Run as part of prisma migration, not application startup

## Visual Design
No visual mockups provided. Follow existing cawpile UI patterns:
- Use TailwindCSS with existing color tokens (orange accent, gray backgrounds)
- Match card/section styling from dashboard and admin pages
- Form inputs should match EditBookModal styling (rounded-md, focus:ring-orange-500)
- Use Headless UI for toggle switches and confirmation dialogs

## Existing Code to Leverage

**User Preferences API Pattern**
- File: `src/app/api/user/preferences/route.ts`
- Pattern for PATCH endpoint with authentication check via `getCurrentUser()`
- Extend this pattern for profile and settings updates

**EditBookModal Form Patterns**
- File: `src/components/modals/EditBookModal.tsx`
- Tab-based UI organization with state management
- Form field styling and validation patterns
- Submit handling with loading states

**Dashboard Page Server Component**
- File: `src/app/dashboard/page.tsx`
- Pattern for authenticated page with user data fetching
- Use `getCurrentUser()` and redirect pattern for auth protection

**UserMenu Navigation**
- File: `src/components/layout/UserMenu.tsx`
- Existing "Settings" button that needs to become a Link to `/settings`
- Pattern for dropdown menu items and styling

**Prisma Schema User Model**
- File: `prisma/schema.prisma`
- Existing User model with `username`, `bio`, `readingGoal` fields already defined
- Need to add `profilePictureUrl` and `showCurrentlyReading` fields
- Cascade deletes already configured on related models (Account, Session, UserBook, etc.)

## Out of Scope
- Connected accounts display (showing Google OAuth connection status)
- Dashboard grid/table layout preference in settings (keep using existing LayoutToggle)
- Data export feature (download books/ratings as CSV/JSON)
- Client-side image cropping UI before upload
- Public profile page implementation (future feature will use the flags set here)
- Email change functionality
- Password management (OAuth-only authentication)
- Two-factor authentication settings
- Notification preferences
- Theme/appearance settings
