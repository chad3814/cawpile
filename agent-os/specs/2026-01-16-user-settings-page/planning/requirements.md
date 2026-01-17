# Spec Requirements: User Settings Page

## Initial Description
A user settings page for the Cawpile project - a book reading tracker with CAWPILE rating system built with Next.js 15, React 19, TypeScript, TailwindCSS 4, Prisma ORM, and NextAuth v5.

## Requirements Discussion

### First Round Questions

**Q1:** I assume this will be a dedicated `/settings` page in the app, accessible from the user profile menu. Is that correct, or should it be a modal overlay?
**Answer:** Dedicated `/settings` page

**Q2:** For profile settings, I'm thinking name, username, bio, and profile picture. The username would need to be unique for future public profile URLs. Should we include all of these, or is there a specific subset you want?
**Answer:** All of these (name, username, bio, profile picture). Username is required, and existing users without one will need a migration to assign `user${randomNumber}` as default.

**Q3:** For preferences, I assume we want reading goal (annual target) and dashboard layout preference (grid/table). Should these both be editable here, or just the reading goal?
**Answer:** Just the reading goal. Dashboard layout preference should NOT be included.

**Q4:** For account settings, should we include connected accounts display (showing Google OAuth connection), account deletion option, or both?
**Answer:** Only account deletion option. No connected accounts display.

**Q5:** For profile picture uploads, should we use local file storage, or integrate with a cloud service like S3/Cloudinary?
**Answer:** S3 integration with specific bucket `cawpile-avatars`. User has an access key for an IAM user.

**Q6:** Should the settings page include a data export feature (download all your books/ratings)?
**Answer:** No, data export should NOT be included.

**Q7:** Is there anything you specifically want to exclude from the settings page?
**Answer:** Exclude connected accounts display, grid/table layout preference, and data export.

### Existing Code to Reference

**Similar Features Identified:**
- Feature: Existing dashboard layout preference - Path: `src/components/dashboard/LayoutToggle.tsx` (for pattern reference, though not including layout in settings)
- Feature: User preferences API - Path: `src/app/api/user/preferences/` (for API pattern reference)
- Feature: Modal patterns - Path: `src/components/modals/` (for form and UI patterns)

### Follow-up Questions

**Follow-up 1:** For the public "currently reading" toggle - should this just set a preference flag for a future public profile feature, or should it actually expose data somewhere now?
**Answer:** Just a data flag for now (future public profile feature will use it)

**Follow-up 2:** For S3 profile picture upload, do you have a preferred S3 bucket name or should we create one? Also, should we handle image resizing on the client before upload, or accept images as-is?
**Answer:** Use specific bucket `cawpile-avatars`. User has an access key for an IAM user. Accept images as-is with server-side resizing (no client-side cropping UI).

**Follow-up 3:** For username validation - should it be case-insensitive for uniqueness (so "JohnDoe" and "johndoe" are considered the same)? And what's the max length?
**Answer:** Case-insensitive uniqueness, limited to 128 characters max, only characters that don't need to be URL escaped (alphanumeric, hyphen, underscore).

**Follow-up 4:** For account deletion - should this be a soft delete (deactivate) or hard delete (permanently remove all data)?
**Answer:** Hard delete - remove everything (user, all books, ratings, sessions, etc.)

## Visual Assets

### Files Provided:
No visual assets provided.

### Visual Insights:
N/A

## Requirements Summary

### Functional Requirements
- Dedicated `/settings` page accessible from user profile menu
- **Profile Section:**
  - Editable display name
  - Required username field (unique, case-insensitive, alphanumeric/hyphen/underscore only, max 128 chars)
  - Bio text field
  - Profile picture upload with S3 storage (`cawpile-avatars` bucket) and server-side resizing
- **Preferences Section:**
  - Annual reading goal (editable number input)
  - Public "currently reading" toggle (stores preference flag for future use)
- **Account Section:**
  - Account deletion with hard delete (cascading delete of all user data)
- **Data Migration:**
  - Existing users without username get assigned `user${randomNumber}` as default

### Reusability Opportunities
- Existing user preferences API pattern at `src/app/api/user/preferences/`
- Modal and form patterns from `src/components/modals/`
- Layout toggle component pattern from `src/components/dashboard/LayoutToggle.tsx`

### Scope Boundaries
**In Scope:**
- `/settings` page with profile, preferences, and account sections
- Profile picture S3 upload with server-side resizing
- Username requirement with validation rules
- Reading goal preference
- Public "currently reading" preference flag
- Hard account deletion with cascading deletes
- Database migration for existing users without usernames

**Out of Scope:**
- Connected accounts display (Google OAuth)
- Dashboard grid/table layout preference
- Data export feature
- Client-side image cropping UI
- Public profile page (future feature)

### Technical Considerations
- S3 integration using `cawpile-avatars` bucket with IAM user access key
- Server-side image resizing for profile pictures
- Case-insensitive username uniqueness check in database
- Username validation: alphanumeric, hyphen, underscore only (URL-safe)
- Cascading delete implementation for account deletion (User, UserBooks, CawpileRatings, ReadingSessions, etc.)
- Database schema changes: add `username`, `bio`, `profilePictureUrl`, `readingGoal`, `showCurrentlyReading` fields to User model
- Migration script to assign default usernames to existing users
