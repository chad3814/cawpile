# Specification: Admin Delete Buttons

## Goal
Add delete functionality to the admin Books and Users pages with confirmation modals, proper permission checks, and audit logging.

## User Stories
- As an admin, I want to delete individual books so that I can remove erroneous or duplicate entries from the system
- As a super admin, I want to delete user accounts so that I can remove inactive or problematic users while seeing a summary of data to be removed

## Specific Requirements

**Books Page Delete Button**
- Add a delete button in the Actions column of BookTable, alongside existing "Edit" and "Re-sync" buttons
- Use TrashIcon from Heroicons to match existing icon patterns
- Button styled consistently with other action buttons (text-red-600 hover:text-red-900)
- Clicking the button opens a confirmation modal (not browser confirm())
- Permission level: Admin (uses existing `requireAdmin()` pattern)

**Books Delete Confirmation Modal**
- Simple confirmation dialog using Headless UI Dialog component
- Display book title in the confirmation message
- No warning about cascade impact on users' libraries
- Two buttons: Cancel (secondary) and Delete (red/destructive)
- Show loading spinner during deletion operation
- Close modal and refresh table on successful deletion

**Books Delete API Endpoint**
- Add DELETE handler to existing `/api/admin/books/[id]/route.ts`
- Use `requireAdmin()` for authorization (same as GET/PATCH)
- Log deletion to AdminAuditLog with `actionType: 'DELETE'` and book data in oldValue
- Prisma cascade handles cleanup: Book -> Editions -> UserBooks -> CawpileRatings, ReadingSessions, GoogleBook, HardcoverBook, IbdbBook

**Users Page Delete Button**
- Add delete button in each user row of AdminUserList component
- Use TrashIcon styled with text-red-600 hover:text-red-900
- Button is DISABLED (not hidden) when user cannot be deleted
- Disabled when: user is admin (isAdmin or isSuperAdmin), or user is current logged-in user
- Show tooltip (title attribute) explaining why button is disabled
- Permission level: Super Admin only (uses `requireSuperAdmin()`)

**Users Delete Confirmation Modal**
- Headless UI Dialog with summary of data to be deleted
- Fetch user stats before showing modal: count of books tracked, shared reviews
- Display summary like "47 books tracked, 12 shared reviews will be deleted"
- No typing test required - simple button confirmation
- Two buttons: Cancel (secondary) and Delete (red/destructive)
- Show loading spinner during deletion operation

**Users Delete API Endpoint**
- Add DELETE handler to existing `/api/admin/users/[id]/route.ts`
- Use `requireSuperAdmin()` for authorization
- Prevent deletion of admin users (isAdmin or isSuperAdmin) at API level
- Prevent self-deletion at API level
- Log deletion to AdminAuditLog with `actionType: 'DELETE'` and user data in oldValue
- Prisma cascade handles cleanup: User -> UserBooks, Sessions, Accounts, SharedReviews, UserBookClubs, UserReadathons

**Audit Logging**
- Use existing `logAdminAction()` function from `src/lib/audit/logger.ts`
- For book deletion: entityType='Book', entityId=bookId, actionType='DELETE', oldValue contains book data
- For user deletion: entityType='User', entityId=userId, actionType='DELETE', oldValue contains user summary

## Existing Code to Leverage

**DeleteAccountModal (`src/components/settings/DeleteAccountModal.tsx`)**
- Reference for modal structure with Headless UI Dialog/Transition pattern
- Reference for destructive action styling (red buttons, warning icon)
- Reference for loading state with spinner during async operation
- Note: This modal uses typing test which is NOT needed for admin delete modals

**BulkUpdateModal (`src/components/admin/BulkUpdateModal.tsx`)**
- Reference for admin modal styling and layout patterns
- Reference for simpler confirmation flow without typing test
- Reference for ExclamationTriangleIcon usage

**BookTable (`src/components/admin/BookTable.tsx`)**
- Add delete button alongside existing Edit link and Re-sync button in Actions column
- Follow existing resync button pattern for loading states and toast notifications
- Use existing `useToast` hook for success/error messages

**AdminUserList (`src/components/admin/AdminUserList.tsx`)**
- Add delete button in the actions area of each user row
- Use existing `currentUserId` prop to check if user is self
- Follow existing disabled state pattern from admin checkbox

**Admin API routes (`/api/admin/books/[id]` and `/api/admin/users/[id]`)**
- Add DELETE handlers following existing PATCH handler patterns
- Use same auth patterns: `requireAdmin()` for books, `requireSuperAdmin()` for users
- Use existing `logAdminAction()` for audit logging

## Out of Scope
- Soft delete functionality - only hard deletes
- Archiving or restore functionality
- Undo capability after deletion
- Bulk delete for books (only individual deletion)
- Warning about users affected when deleting a book
- Typing test confirmation for admin delete modals
- Email notification to deleted users
- Backup creation before deletion
- Confirmation by entering book title or user email
- Cascading delete preview showing exact counts of related records
