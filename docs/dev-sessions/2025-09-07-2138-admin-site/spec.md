# Admin Site Specification

**Date**: 2025-09-07 21:38  
**Branch**: admin-site  
**Purpose**: Create an admin site to edit book details
**Last Updated**: 2025-09-07 (after brainstorming session)

## Overview

Create an administrative interface to manage and edit book details in the CAWPILE application. This will allow administrators to:
- Edit book metadata (title, authors, categories, etc.)
- Update book type (fiction/non-fiction)
- Manage Google Books data
- Fix incorrect categorizations
- Merge duplicate books/editions
- Track all changes with comprehensive audit logging

## Requirements

### Authentication & Authorization
- Single super-admin can grant admin privileges to other users
- Admin privileges are permanent (no expiration)
- Add `isAdmin` and `isSuperAdmin` boolean fields to User model
- Protect all admin routes with middleware
- Admin management interface only accessible to super-admin

### Admin Dashboard
- Display total counts (books, users, editions, ratings)
- Show recent admin activity log (last 10 changes)
- Data quality metrics with direct links to filtered book lists:
  - Books missing ISBNs
  - Books without categories
  - Books without Google Books links
  - Potential duplicate books
- Quick navigation to main admin functions

### Book Management Features
1. **Book List View**
   - Paginated table (default 25 per page)
   - User-selectable pagination: 10, 25, 50, or 100 items per page
   - Search with dropdown to select field: Title, Author, or ISBN
   - Real-time search with debouncing (search-as-you-type)
   - Checkbox selection on each row for bulk operations
   - Maximum 100 books selectable for bulk operations
   - Sort by any column
   - Filter by book type and language

2. **Book Detail/Edit View**
   - **Editable fields:**
     - Title
     - Authors (add/remove/reorder)
     - Book type (fiction/non-fiction)
     - Language
     - Categories
     - Page count
     - Published date
     - Description
     - Image URL
   - **Non-editable fields:**
     - ISBNs (immutable)
     - Google Books ID
     - Database IDs
   - View count of users who have this book
   - View all related editions
   - Lazy load related data for performance

3. **Edition Management**
   - Merge duplicate editions
   - Automatic user data consolidation when merging
   - View/edit Google Books connection
   - Handle ISBN conflicts

4. **Batch Operations**
   - Bulk update book type (fiction/non-fiction) only
   - Checkbox selection interface
   - Confirmation dialog before processing
   - Maximum 100 books per batch operation

## Technical Implementation

### Database Changes
- Add `isAdmin` and `isSuperAdmin` boolean fields to User model
- Create `AdminAuditLog` table with:
  - adminId (who made the change)
  - timestamp
  - entity type (Book, Edition, User, etc.)
  - entity ID
  - field name (column that changed)
  - old value
  - new value
  - action type (CREATE, UPDATE, DELETE, MERGE)

### API Endpoints
- `/api/admin/books` - List all books with pagination and search
- `/api/admin/books/[id]` - Get/update specific book
- `/api/admin/books/bulk` - Bulk update book types
- `/api/admin/editions/[id]` - Manage editions
- `/api/admin/editions/merge` - Merge duplicate editions
- `/api/admin/stats` - Dashboard statistics
- `/api/admin/audit-log` - Retrieve audit history
- `/api/admin/users` - Admin user management (super-admin only)
- `/api/admin/data-quality` - Get books with data issues

### UI Components
- `AdminLayout` - Wrapper with admin navigation
- `AdminDashboard` - Dashboard with stats and quick links
- `BookTable` - Paginated table with search and checkboxes
- `BookEditForm` - Comprehensive edit form for book details
- `SearchBar` - Dropdown field selector with debounced input
- `BulkActionBar` - Appears when items selected, shows count and actions
- `AuditHistory` - Shows change history for an entity
- `DataQualityWidget` - Dashboard widget showing data issues
- `AdminUserList` - Super-admin only user management

### Routes
- `/admin` - Dashboard
- `/admin/books` - Book list
- `/admin/books/[id]` - Edit specific book
- `/admin/editions/[id]` - Edit specific edition
- `/admin/users` - Admin user management (super-admin only)
- `/admin/audit-log` - View system-wide audit log

## Security Considerations
- Middleware verifies admin status on all `/admin/*` routes
- Super-admin check for user management endpoints
- All changes logged to audit table with full details
- Server-side validation on all inputs
- Confirmation dialogs for:
  - Bulk operations
  - Edition merging
  - Any destructive action
- Rate limiting on admin endpoints
- Session timeout after inactivity

## Performance Requirements
- Book list loads in under 2 seconds for up to 10,000 books
- Search results appear within 300ms of typing (after debounce)
- Bulk operations process within 5 seconds for 100 books
- Lazy loading for related data (editions, user counts)
- Pagination to limit database queries
- Caching for dashboard statistics (refresh every 5 minutes)

## User Experience
- Clean, professional interface matching main app design
- Clear visual distinction for admin area (different header color/style)
- Responsive design for tablet use (not optimized for phone)
- Toast notifications for successful operations
- Loading states for all async operations
- Clear error messages with actionable information
- Breadcrumb navigation for context
- Unsaved changes warning when navigating away

## Data Integrity
- All edits maintain referential integrity
- Edition merging consolidates all user data
- No orphaned records after operations
- Validation prevents invalid data entry
- Audit log is immutable (no edits or deletions)

## Out of Scope (Future)
- General user management beyond admin privileges
- Reading session management
- Review moderation
- Advanced analytics dashboards
- CSV import/export functionality
- Automated duplicate detection
- Rollback functionality for changes
- Book cover image upload

## Success Criteria
1. Super-admin can grant/revoke admin privileges
2. Admins can search and find any book within 2 seconds
3. All editable book fields can be modified and saved
4. Bulk book type updates work for up to 100 books
5. Edition merging correctly consolidates user data
6. Complete audit trail for all admin actions
7. Dashboard shows accurate statistics and data quality metrics
8. Changes are immediately reflected in user-facing app
9. No non-admin users can access admin functionality
10. System remains performant with concurrent admin users