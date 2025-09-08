# Admin Site Implementation Plan

## Overview
This plan breaks down the admin site implementation into small, iterative chunks that build on each other. Each step is designed to be safely implementable while making meaningful progress. The approach prioritizes building a foundation first, then layering features progressively.

## Implementation Philosophy
- **Incremental Progress**: Each step produces working code
- **No Orphaned Code**: Every piece connects to the previous work
- **Test as You Go**: Verify each component before moving forward
- **Safety First**: Database changes before UI, auth before features

---

## Phase 1: Database Foundation (Steps 1-3)
*Goal: Establish the data layer for admin functionality*

### Step 1: Add Admin Fields to User Model
**Prompt 1: Database Schema Update**
```
Update the Prisma schema to add admin fields to the User model:
1. Add `isAdmin` boolean field (default false) to User model
2. Add `isSuperAdmin` boolean field (default false) to User model
3. Create the AdminAuditLog model with fields: id, adminId, timestamp, entityType, entityId, fieldName, oldValue, newValue, actionType
4. Add the relation from AdminAuditLog to User (admin)
5. Generate and apply the Prisma migration
6. Create a seed script to set one test user as super-admin

Ensure the migration is reversible and doesn't affect existing data.
```

### Step 2: Create Admin Check Utilities
**Prompt 2: Authentication Helpers**
```
Create utility functions for admin authentication:
1. Create src/lib/auth/admin.ts with:
   - isUserAdmin(userId): Check if user has admin privileges
   - isUserSuperAdmin(userId): Check if user has super-admin privileges
   - requireAdmin(): Throws error if current user isn't admin
   - requireSuperAdmin(): Throws error if current user isn't super-admin
2. Create src/lib/audit/logger.ts with:
   - logAdminAction(): Function to create audit log entries
   - formatAuditEntry(): Format audit data for storage
3. Add types in src/types/admin.ts for AdminUser, AuditAction, etc.

These utilities will be used throughout the admin features.
```

### Step 3: Create Admin Middleware
**Prompt 3: Route Protection**
```
Create middleware to protect admin routes:
1. Create src/middleware/admin.ts with NextJS middleware
2. Check for admin status on all /admin/* routes
3. Redirect non-admins to home page with error message
4. Add super-admin check for /admin/users routes
5. Set up proper error handling and logging
6. Test middleware with different user types

The middleware should integrate with existing auth system.
```

---

## Phase 2: Admin Layout Infrastructure (Steps 4-6)
*Goal: Create the admin UI foundation*

### Step 4: Admin Layout Components
**Prompt 4: Layout Structure**
```
Create the admin layout foundation:
1. Create src/app/admin/layout.tsx with:
   - Admin-specific header with distinct styling
   - Sidebar navigation menu
   - Main content area with consistent padding
2. Create src/components/admin/AdminNav.tsx with:
   - Dashboard link
   - Books management link
   - Users management link (visible only to super-admin)
   - Audit log link
   - Visual indicator for current page
3. Add admin-specific styles in a new CSS module
4. Ensure responsive design for tablet and desktop

The layout should clearly distinguish the admin area from the main app.
```

### Step 5: Admin Dashboard Page
**Prompt 5: Dashboard Implementation**
```
Create the admin dashboard with basic stats:
1. Create src/app/admin/page.tsx as the dashboard
2. Create src/components/admin/StatsCard.tsx for displaying metrics
3. Create src/app/api/admin/stats/route.ts to fetch:
   - Total books count
   - Total users count
   - Total editions count
   - Books by type (fiction/non-fiction)
4. Display stats in a grid layout
5. Add loading skeletons while data fetches
6. Include welcome message with admin's name

The dashboard should load quickly and show real data.
```

### Step 6: Add Admin Link to Main Navigation
**Prompt 6: Navigation Integration**
```
Integrate admin access into the main app:
1. Update the main navigation component to include admin link
2. Only show the link if user is admin
3. Add an admin badge/icon to distinguish the link
4. Ensure the link maintains active state in admin area
5. Test with both admin and non-admin users

The integration should be seamless and secure.
```

---

## Phase 3: Book List and Search (Steps 7-11)
*Goal: Implement the core book management interface*

### Step 7: Books API Endpoint with Pagination
**Prompt 7: Book List API**
```
Create the books listing API endpoint:
1. Create src/app/api/admin/books/route.ts with:
   - GET handler with pagination support
   - Query params: page, limit (10/25/50/100), search, searchField
   - Return books with basic info: id, title, authors, type, language
   - Include total count for pagination
2. Implement efficient database queries with Prisma
3. Add proper error handling and validation
4. Ensure only admins can access this endpoint

The API should handle thousands of books efficiently.
```

### Step 8: Book Table Component
**Prompt 8: Table Implementation**
```
Create the paginated book table:
1. Create src/components/admin/BookTable.tsx with:
   - Table with columns: checkbox, title, authors, type, language, actions
   - Sortable column headers
   - Row selection with checkboxes
   - Edit button for each row
2. Create src/components/admin/Pagination.tsx with:
   - Page number display
   - Previous/Next buttons
   - Items per page selector (10/25/50/100)
3. Implement loading and empty states
4. Make the table responsive for tablets

The table should be clean and easy to scan.
```

### Step 9: Search Functionality
**Prompt 9: Search Implementation**
```
Add search with field selection:
1. Create src/components/admin/BookSearch.tsx with:
   - Search input field
   - Dropdown to select: Title, Author, or ISBN
   - Debounced input (300ms delay)
   - Clear button when search is active
2. Update the book list API to handle search
3. Implement search logic in the database query
4. Show search results count
5. Maintain search state in URL params

Search should feel responsive with real-time results.
```

### Step 10: Book Filters
**Prompt 10: Filter Controls**
```
Add filtering capabilities:
1. Create src/components/admin/BookFilters.tsx with:
   - Book type filter (All/Fiction/Non-fiction)
   - Language filter dropdown
   - Active filter indicators
2. Update API to handle multiple filters
3. Combine filters with search functionality
4. Add filter reset button
5. Persist filter state in URL

Filters should work seamlessly with search and pagination.
```

### Step 11: Wire Book List Page Together
**Prompt 11: Complete Book List**
```
Integrate all book list components:
1. Create src/app/admin/books/page.tsx
2. Combine BookSearch, BookFilters, BookTable, and Pagination
3. Manage state for search, filters, and selection
4. Add breadcrumb navigation
5. Include count of selected books when any are checked
6. Test with various combinations of search and filters

The page should feel cohesive and performant.
```

---

## Phase 4: Book Editing (Steps 12-15)
*Goal: Enable editing of individual book details*

### Step 12: Book Detail API
**Prompt 12: Single Book Endpoint**
```
Create API for individual book operations:
1. Create src/app/api/admin/books/[id]/route.ts with:
   - GET handler to fetch complete book details
   - PATCH handler to update book fields
   - Include related editions and user count
2. Implement field validation for updates
3. Create audit log entries for each change
4. Return updated book data after successful update

The API should handle all editable fields safely.
```

### Step 13: Book Edit Form Component
**Prompt 13: Edit Form Implementation**
```
Create comprehensive book editing form:
1. Create src/components/admin/BookEditForm.tsx with:
   - All editable fields from spec (title, authors, type, etc.)
   - Non-editable field display (ISBNs, IDs)
   - Dynamic author list (add/remove/reorder)
   - Category multi-select
   - Date picker for published date
2. Implement form validation
3. Show loading state during save
4. Display success/error messages
5. Add unsaved changes warning

The form should be intuitive and prevent data loss.
```

### Step 14: Book Edit Page
**Prompt 14: Edit Page Integration**
```
Create the book editing page:
1. Create src/app/admin/books/[id]/page.tsx
2. Fetch book data on load
3. Display BookEditForm with data
4. Add breadcrumb navigation
5. Include "Back to list" button
6. Show related editions section (lazy loaded)
7. Display user count who have this book

The page should provide complete book management.
```

### Step 15: Connect Edit Actions from Table
**Prompt 15: Navigation Flow**
```
Connect the book table to edit pages:
1. Update BookTable to make edit buttons functional
2. Add loading state when navigating to edit
3. Preserve search/filter state when returning to list
4. Add success message after saving changes
5. Test the complete flow: list → edit → save → list

The navigation should feel smooth and maintain context.
```

---

## Phase 5: Bulk Operations (Steps 16-18)
*Goal: Enable batch updates for book types*

### Step 16: Bulk Selection UI
**Prompt 16: Selection Management**
```
Implement bulk selection interface:
1. Create src/components/admin/BulkActionBar.tsx that:
   - Shows when books are selected
   - Displays count of selected books
   - Has "Change Type" button
   - Has "Clear Selection" button
2. Update BookTable to track selection state
3. Add "Select All" checkbox in table header
4. Limit selection to maximum 100 books
5. Show warning when limit is reached

The selection UI should be clear and prevent errors.
```

### Step 17: Bulk Update API
**Prompt 17: Batch Operations Endpoint**
```
Create bulk update endpoint:
1. Create src/app/api/admin/books/bulk/route.ts with:
   - POST handler for bulk type updates
   - Accept array of book IDs and new type
   - Validate all IDs exist and are valid
   - Update all books in a transaction
   - Create audit log entries for each change
2. Return success/failure counts
3. Implement proper error handling

The API should be atomic and efficient.
```

### Step 18: Bulk Update Modal
**Prompt 18: Confirmation Dialog**
```
Add bulk update confirmation:
1. Create src/components/admin/BulkUpdateModal.tsx with:
   - Summary of books to be updated
   - Type selection (Fiction/Non-fiction)
   - Confirmation button with loading state
   - Cancel button
2. Wire modal to BulkActionBar
3. Call bulk update API on confirmation
4. Show success/error messages
5. Clear selection after successful update

The modal should prevent accidental bulk changes.
```

---

## Phase 6: Audit and Activity (Steps 19-21)
*Goal: Add tracking and transparency*

### Step 19: Audit Log API
**Prompt 19: Audit History Endpoint**
```
Create audit log retrieval API:
1. Create src/app/api/admin/audit-log/route.ts with:
   - GET handler with pagination
   - Filter by entity type, admin, date range
   - Include admin user details in response
   - Sort by timestamp (newest first)
2. Format audit entries for display
3. Implement efficient querying

The API should handle large audit histories.
```

### Step 20: Audit History Component
**Prompt 20: Activity Display**
```
Create audit history display:
1. Create src/components/admin/AuditHistory.tsx with:
   - Timeline-style display of changes
   - Show who, what, when for each change
   - Display old and new values
   - Color coding for action types
2. Create src/components/admin/AuditEntry.tsx for individual entries
3. Add pagination for long histories
4. Include filter controls

The history should be easy to read and understand.
```

### Step 21: Dashboard Activity Feed
**Prompt 21: Recent Activity**
```
Add activity feed to dashboard:
1. Update dashboard to include recent activity section
2. Show last 10 admin actions
3. Make entries clickable to view affected entity
4. Add "View All" link to full audit log
5. Auto-refresh activity feed every minute

The feed should provide quick oversight of admin actions.
```

---

## Phase 7: Data Quality (Steps 22-24)
*Goal: Surface and fix data issues*

### Step 22: Data Quality API
**Prompt 22: Quality Metrics Endpoint**
```
Create data quality checking API:
1. Create src/app/api/admin/data-quality/route.ts that identifies:
   - Books missing ISBNs
   - Books without categories
   - Books without Google Books links
   - Potential duplicates (same title/author)
2. Return counts and lists for each issue type
3. Cache results for 5 minutes
4. Include direct links to filtered book lists

The API should help identify data problems.
```

### Step 23: Data Quality Widget
**Prompt 23: Quality Dashboard**
```
Create data quality dashboard widget:
1. Create src/components/admin/DataQualityWidget.tsx with:
   - Cards for each data issue type
   - Count of affected books
   - Severity indicator (color coding)
   - Click to view affected books
2. Add to admin dashboard
3. Include refresh button
4. Show last update time

The widget should highlight issues needing attention.
```

### Step 24: Link Quality Metrics to Filtered Lists
**Prompt 24: Quality Navigation**
```
Connect quality metrics to book list:
1. Update book list to accept quality filter params
2. Add quality issue badges to affected books
3. Create pre-defined filter links from dashboard
4. Show quality filter in active filters
5. Test navigation from dashboard to filtered lists

The integration should make fixing issues efficient.
```

---

## Phase 8: User Management (Steps 25-27)
*Goal: Enable super-admin user control*

### Step 25: User Management API
**Prompt 25: User Admin Endpoint**
```
Create user management API (super-admin only):
1. Create src/app/api/admin/users/route.ts with:
   - GET handler to list users with admin status
   - PATCH handler to grant/revoke admin privileges
   - Super-admin verification for all operations
   - Audit logging for privilege changes
2. Prevent self-demotion for super-admin
3. Include user statistics in response

The API should be highly secure.
```

### Step 26: Admin User List Component
**Prompt 26: User Management UI**
```
Create user management interface:
1. Create src/components/admin/AdminUserList.tsx with:
   - Table of users with admin status
   - Toggle switches for admin privileges
   - Super-admin badge display
   - Search by name or email
   - Confirmation dialog for changes
2. Only show to super-admin users
3. Disable self-modification

The interface should prevent accidental privilege changes.
```

### Step 27: Wire User Management Page
**Prompt 27: User Management Integration**
```
Complete user management feature:
1. Create src/app/admin/users/page.tsx
2. Integrate AdminUserList component
3. Add breadcrumb navigation
4. Include total counts
5. Show audit history for user changes
6. Test with super-admin and regular admin

The page should provide complete user control.
```

---

## Phase 9: Polish and Optimization (Steps 28-30)
*Goal: Refine the admin experience*

### Step 28: Loading States and Error Handling
**Prompt 28: UX Improvements**
```
Add polish to all admin pages:
1. Add loading skeletons to all data fetching
2. Implement error boundaries with friendly messages
3. Add retry buttons for failed requests
4. Create consistent toast notifications for actions
5. Add empty states with helpful messages
6. Implement optimistic updates where appropriate

The admin area should feel professional and responsive.
```

### Step 29: Performance Optimization
**Prompt 29: Speed Improvements**
```
Optimize admin area performance:
1. Implement lazy loading for all routes
2. Add React.memo to expensive components
3. Optimize database queries with proper indexes
4. Implement virtual scrolling for large lists
5. Add request debouncing and throttling
6. Cache frequently accessed data

The admin area should remain fast with large datasets.
```

### Step 30: Final Integration and Testing
**Prompt 30: Complete Integration**
```
Final integration and testing:
1. Test complete user journeys
2. Verify all audit logging works
3. Check responsive design on tablets
4. Ensure all error cases are handled
5. Validate security for all endpoints
6. Test with multiple concurrent admin users
7. Add any missing breadcrumbs or navigation

The admin site should be production-ready.
```

---

## Implementation Notes

### Order of Implementation
1. **Foundation First**: Database and auth (Steps 1-3) must come first
2. **Layout Before Features**: UI structure (Steps 4-6) before functionality
3. **Read Before Write**: List/search (Steps 7-11) before editing (Steps 12-15)
4. **Core Before Enhanced**: Basic features before bulk operations
5. **Function Before Polish**: Get it working before optimizing

### Testing Strategy
- Test each step independently before moving forward
- Verify middleware and auth at each stage
- Check audit logging throughout
- Test with both admin and non-admin users
- Validate data integrity after operations

### Security Checkpoints
- Step 3: Middleware properly blocks non-admins
- Step 12: API validates all inputs
- Step 17: Bulk operations are atomic
- Step 25: Super-admin checks are enforced
- Step 30: Final security audit

### Performance Milestones
- Step 11: Book list loads under 2 seconds
- Step 9: Search responds within 300ms
- Step 17: Bulk operations complete within 5 seconds
- Step 29: All optimizations in place