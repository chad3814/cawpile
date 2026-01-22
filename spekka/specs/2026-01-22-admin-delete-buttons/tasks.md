# Task Breakdown: Admin Delete Buttons

## Overview
Total Tasks: 23
Estimated Test Count: 12-18 tests total

## Summary
Add delete functionality to admin Books and Users pages with confirmation modals, proper permission checks, and audit logging.

## Task List

### API Layer

#### Task Group 1: Book Delete API Endpoint
**Dependencies:** None

- [x] 1.0 Complete Book Delete API endpoint
  - [x] 1.1 Write 2-4 focused tests for DELETE /api/admin/books/[id]
    - Test successful book deletion with audit logging
    - Test unauthorized access (non-admin user)
    - Test 404 response for non-existent book
    - Test that cascade delete removes related editions
  - [x] 1.2 Add DELETE handler to `/src/app/api/admin/books/[id]/route.ts`
    - Use existing `getCurrentUser()` from `@/lib/auth/admin`
    - Check `user.isAdmin` for authorization (same as GET/PATCH handlers)
    - Fetch book data before deletion for audit logging
    - Use `prisma.book.delete()` - Prisma cascade handles cleanup
    - Return 401 for unauthorized, 404 for not found, 200 for success
  - [x] 1.3 Add audit logging for book deletion
    - Use existing `logAdminAction()` from `@/lib/audit/logger`
    - Log with: `entityType: 'Book'`, `entityId: bookId`, `actionType: 'DELETE'`
    - Store book title, authors, and bookType in `oldValue` field
  - [x] 1.4 Ensure Book Delete API tests pass
    - Run ONLY the 2-4 tests written in 1.1
    - Verify authorization, deletion, and audit logging work correctly

**Acceptance Criteria:**
- DELETE endpoint returns 200 on successful deletion
- Returns 401 for non-admin users
- Returns 404 for non-existent books
- Deletion is logged to AdminAuditLog with book data in oldValue
- Prisma cascade removes all related Editions, UserBooks, GoogleBook records

---

#### Task Group 2: User Delete API Endpoint
**Dependencies:** None (can run parallel with Task Group 1)

- [x] 2.0 Complete User Delete API endpoint
  - [x] 2.1 Write 2-4 focused tests for DELETE /api/admin/users/[id]
    - Test successful user deletion with audit logging (super admin only)
    - Test unauthorized access (non-super-admin)
    - Test prevention of admin user deletion
    - Test prevention of self-deletion
  - [x] 2.2 Add DELETE handler to `/src/app/api/admin/users/[id]/route.ts`
    - Use existing `requireSuperAdmin()` from `@/lib/auth/admin`
    - Check target user's `isAdmin` and `isSuperAdmin` flags - prevent deletion if either is true
    - Check if target user ID matches current admin ID - prevent self-deletion
    - Fetch user summary before deletion for audit logging
    - Use `prisma.user.delete()` - Prisma cascade handles cleanup
    - Return 401 for unauthorized, 400 for admin/self-deletion attempts, 404 for not found
  - [x] 2.3 Add audit logging for user deletion
    - Use existing `logAdminAction()` from `@/lib/audit/logger`
    - Log with: `entityType: 'User'`, `entityId: userId`, `actionType: 'DELETE'`
    - Store user email, name, and book count in `oldValue` field
  - [x] 2.4 Ensure User Delete API tests pass
    - Run ONLY the 2-4 tests written in 2.1
    - Verify authorization, deletion prevention, and audit logging work correctly

**Acceptance Criteria:**
- DELETE endpoint returns 200 on successful deletion
- Returns 401 for non-super-admin users
- Returns 400 when attempting to delete admin users (isAdmin or isSuperAdmin)
- Returns 400 when attempting self-deletion
- Returns 404 for non-existent users
- Deletion is logged to AdminAuditLog with user summary in oldValue

---

#### Task Group 3: User Stats API Endpoint
**Dependencies:** None (can run parallel with Task Groups 1-2)

- [x] 3.0 Complete User Stats API endpoint for delete modal
  - [x] 3.1 Write 2 focused tests for GET /api/admin/users/[id]/stats
    - Test successful stats retrieval (super admin only)
    - Test unauthorized access (non-super-admin)
  - [x] 3.2 Create GET handler at `/src/app/api/admin/users/[id]/stats/route.ts`
    - Use existing `requireSuperAdmin()` from `@/lib/auth/admin`
    - Query user with counts: `userBooks`, `sharedReviews`
    - Return JSON with `{ booksCount: number, sharedReviewsCount: number }`
    - Return 404 if user not found
  - [x] 3.3 Ensure User Stats API tests pass
    - Run ONLY the 2 tests written in 3.1

**Acceptance Criteria:**
- GET endpoint returns user stats including book count and shared review count
- Returns 401 for non-super-admin users
- Returns 404 for non-existent users

---

### UI Components

#### Task Group 4: Book Delete Confirmation Modal
**Dependencies:** Task Group 1

- [x] 4.0 Complete Book Delete Confirmation Modal
  - [x] 4.1 Write 2-3 focused tests for DeleteBookModal component
    - Test modal renders with book title in confirmation message
    - Test Cancel button closes modal without deletion
    - Test Delete button calls onConfirm and shows loading state
  - [x] 4.2 Create `/src/components/admin/DeleteBookModal.tsx`
    - Use Headless UI Dialog/Transition pattern (reference: `BulkUpdateModal.tsx`)
    - Props: `isOpen`, `onClose`, `bookTitle`, `bookId`, `onConfirm`
    - Display ExclamationTriangleIcon with red styling
    - Confirmation message: "Are you sure you want to delete [bookTitle]?"
    - Two buttons: Cancel (secondary gray) and Delete (red bg-red-600)
    - Show loading spinner during deletion (reference: `DeleteAccountModal.tsx` line 144-147)
    - Disable buttons during deletion operation
  - [x] 4.3 Ensure DeleteBookModal tests pass
    - Run ONLY the 2-3 tests written in 4.1

**Acceptance Criteria:**
- Modal displays book title in confirmation message
- Cancel button closes modal without side effects
- Delete button triggers deletion and shows loading spinner
- Modal follows existing admin modal styling patterns

---

#### Task Group 5: User Delete Confirmation Modal
**Dependencies:** Task Groups 2-3

- [x] 5.0 Complete User Delete Confirmation Modal
  - [x] 5.1 Write 2-3 focused tests for DeleteUserModal component
    - Test modal fetches and displays user stats
    - Test Cancel button closes modal without deletion
    - Test Delete button calls onConfirm with loading state
  - [x] 5.2 Create `/src/components/admin/DeleteUserModal.tsx`
    - Use Headless UI Dialog/Transition pattern (reference: `BulkUpdateModal.tsx`)
    - Props: `isOpen`, `onClose`, `userId`, `userEmail`, `onConfirm`
    - Fetch user stats on modal open via `/api/admin/users/[id]/stats`
    - Display ExclamationTriangleIcon with red styling
    - Show loading skeleton while fetching stats
    - Display summary: "[X] books tracked, [Y] shared reviews will be deleted"
    - Two buttons: Cancel (secondary gray) and Delete (red bg-red-600)
    - Show loading spinner during deletion operation
  - [x] 5.3 Ensure DeleteUserModal tests pass
    - Run ONLY the 2-3 tests written in 5.1

**Acceptance Criteria:**
- Modal fetches and displays user stats (book count, shared review count)
- Loading state shown while fetching stats
- Cancel button closes modal without side effects
- Delete button triggers deletion and shows loading spinner

---

#### Task Group 6: BookTable Delete Button Integration
**Dependencies:** Task Group 4

- [x] 6.0 Complete BookTable delete button integration
  - [x] 6.1 Write 2 focused tests for BookTable delete functionality
    - Test delete button renders with TrashIcon for each book row
    - Test clicking delete button opens DeleteBookModal
  - [x] 6.2 Add delete button to `/src/components/admin/BookTable.tsx`
    - Import TrashIcon from `@heroicons/react/24/outline`
    - Import DeleteBookModal component
    - Add state: `deletingBook: { id: string, title: string } | null`
    - Add delete button in Actions column after Re-sync button
    - Style: `text-red-600 hover:text-red-900 inline-flex items-center`
    - Button text: "Delete" with TrashIcon (h-4 w-4 mr-1)
    - onClick: Set `deletingBook` state to open modal
  - [x] 6.3 Implement delete handler in BookTable
    - Create `handleDelete` async function
    - Call `DELETE /api/admin/books/${bookId}`
    - On success: Show toast via existing `showToast('success', ...)`, call refresh callback
    - On error: Show toast via existing `showToast('error', ...)`
    - Close modal after operation completes
  - [x] 6.4 Add onRefresh callback prop to BookTable
    - Add `onRefresh?: () => void` to BookTableProps interface
    - Call `onRefresh()` after successful deletion to refresh table data
  - [x] 6.5 Ensure BookTable delete tests pass
    - Run ONLY the 2 tests written in 6.1

**Acceptance Criteria:**
- Delete button appears in Actions column for each book row
- Delete button styled consistently with red color scheme
- Clicking Delete opens confirmation modal with book title
- Successful deletion shows success toast and refreshes table
- Failed deletion shows error toast

---

#### Task Group 7: AdminUserList Delete Button Integration
**Dependencies:** Task Group 5

- [x] 7.0 Complete AdminUserList delete button integration
  - [x] 7.1 Write 2-3 focused tests for AdminUserList delete functionality
    - Test delete button renders for non-admin users
    - Test delete button is disabled for admin users with tooltip
    - Test delete button is disabled for current user with tooltip
  - [x] 7.2 Add delete button to `/src/components/admin/AdminUserList.tsx`
    - Import TrashIcon from `@heroicons/react/24/outline`
    - Import DeleteUserModal component
    - Add state: `deletingUser: { id: string, email: string } | null`
    - Add delete button in the actions area of each user row
    - Style: `text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed`
  - [x] 7.3 Implement delete button disabled logic
    - Disabled when: `user.isAdmin || user.isSuperAdmin || user.id === currentUserId`
    - Add `title` attribute for tooltip explaining why disabled:
      - "Cannot delete admin users" when user is admin/super admin
      - "Cannot delete your own account" when user is current user
  - [x] 7.4 Implement delete handler in AdminUserList
    - Create `handleDeleteUser` async function
    - Call `DELETE /api/admin/users/${userId}`
    - On success: Call `router.refresh()` to refresh user list
    - On error: Show alert with error message
    - Close modal after operation completes
  - [x] 7.5 Ensure AdminUserList delete tests pass
    - Run ONLY the 2-3 tests written in 7.1

**Acceptance Criteria:**
- Delete button appears for each user in the list
- Delete button is disabled (not hidden) for admin users
- Delete button is disabled for current logged-in user
- Tooltip explains why button is disabled
- Clicking enabled Delete button opens confirmation modal
- Successful deletion refreshes the user list

---

### Integration

#### Task Group 8: Admin Page Integration
**Dependencies:** Task Groups 6-7

- [x] 8.0 Complete admin page integration
  - [x] 8.1 Update `/src/app/admin/books/page.tsx` to pass onRefresh to BookTable
    - Verify BookTable receives and uses onRefresh callback
    - Ensure page refetches data when onRefresh is called
  - [x] 8.2 Verify AdminUserList integration in `/src/app/admin/users/page.tsx`
    - Confirm currentUserId is passed correctly
    - Verify delete functionality works end-to-end
  - [x] 8.3 Manual integration verification
    - Test book deletion flow: button -> modal -> confirm -> refresh
    - Test user deletion flow: button -> modal (with stats) -> confirm -> refresh
    - Verify audit log entries appear correctly

**Acceptance Criteria:**
- Book deletion works end-to-end from admin books page
- User deletion works end-to-end from admin users page
- Audit log shows deletion entries with appropriate data

---

### Testing

#### Task Group 9: Test Review and Gap Analysis
**Dependencies:** Task Groups 1-8

- [x] 9.0 Review existing tests and fill critical gaps
  - [x] 9.1 Review tests from Task Groups 1-7
    - Review API tests (Groups 1-3): ~8-10 tests
    - Review component tests (Groups 4-7): ~8-11 tests
    - Total existing tests: approximately 16-21 tests
  - [x] 9.2 Analyze test coverage gaps for admin delete feature
    - Identify any missing error edge cases
    - Check integration between modal and API
    - Verify audit logging is tested
  - [x] 9.3 Write up to 5 additional tests if critical gaps identified
    - Focus on integration between components
    - Add edge case tests only if critical path is missing coverage
  - [x] 9.4 Run all feature-specific tests
    - Run ONLY tests related to admin delete functionality
    - Expected total: approximately 16-26 tests
    - Verify all critical workflows pass

**Acceptance Criteria:**
- All feature-specific tests pass
- Critical user workflows for delete functionality are covered
- No more than 5 additional tests added for gap filling

---

## Execution Order

Recommended implementation sequence:

1. **API Layer (Parallel)**
   - Task Group 1: Book Delete API (can start immediately)
   - Task Group 2: User Delete API (can start immediately)
   - Task Group 3: User Stats API (can start immediately)

2. **UI Components (Sequential after dependencies)**
   - Task Group 4: DeleteBookModal (after Task Group 1)
   - Task Group 5: DeleteUserModal (after Task Groups 2-3)

3. **Integration (Sequential after dependencies)**
   - Task Group 6: BookTable integration (after Task Group 4)
   - Task Group 7: AdminUserList integration (after Task Group 5)
   - Task Group 8: Admin page integration (after Task Groups 6-7)

4. **Testing**
   - Task Group 9: Test review and gap analysis (after all groups complete)

---

## Key File Paths

### Files to Modify
- `/Users/cwalker/Projects/cawpile/main/src/app/api/admin/books/[id]/route.ts` - Add DELETE handler
- `/Users/cwalker/Projects/cawpile/main/src/app/api/admin/users/[id]/route.ts` - Add DELETE handler
- `/Users/cwalker/Projects/cawpile/main/src/components/admin/BookTable.tsx` - Add delete button and modal
- `/Users/cwalker/Projects/cawpile/main/src/components/admin/AdminUserList.tsx` - Add delete button and modal

### Files to Create
- `/Users/cwalker/Projects/cawpile/main/src/app/api/admin/users/[id]/stats/route.ts` - User stats endpoint
- `/Users/cwalker/Projects/cawpile/main/src/components/admin/DeleteBookModal.tsx` - Book delete confirmation
- `/Users/cwalker/Projects/cawpile/main/src/components/admin/DeleteUserModal.tsx` - User delete confirmation

### Reference Files
- `/Users/cwalker/Projects/cawpile/main/src/components/admin/BulkUpdateModal.tsx` - Modal pattern reference
- `/Users/cwalker/Projects/cawpile/main/src/components/settings/DeleteAccountModal.tsx` - Loading state reference
- `/Users/cwalker/Projects/cawpile/main/src/lib/audit/logger.ts` - Audit logging functions
- `/Users/cwalker/Projects/cawpile/main/src/lib/auth/admin.ts` - Auth helper functions

### Test Files to Create
- `/Users/cwalker/Projects/cawpile/main/__tests__/api/admin/books-delete.test.ts`
- `/Users/cwalker/Projects/cawpile/main/__tests__/api/admin/users-delete.test.ts`
- `/Users/cwalker/Projects/cawpile/main/__tests__/api/admin/users-stats.test.ts`
- `/Users/cwalker/Projects/cawpile/main/__tests__/components/admin/DeleteBookModal.test.tsx`
- `/Users/cwalker/Projects/cawpile/main/__tests__/components/admin/DeleteUserModal.test.tsx`
- `/Users/cwalker/Projects/cawpile/main/__tests__/components/admin/BookTable-delete.test.tsx`
- `/Users/cwalker/Projects/cawpile/main/__tests__/components/admin/AdminUserList-delete.test.tsx`
