# Task Breakdown: Library Sort by End Date

## Overview
Total Tasks: 12

This feature adds a sort dropdown to the dashboard library, defaulting to end date descending, with user preferences persisted to the database.

## Task List

### Database Layer

#### Task Group 1: Schema and Migration ✅
**Dependencies:** None

- [x] 1.0 Complete database schema changes
  - [x] 1.1 Add enums to Prisma schema
    - Add `LibrarySortBy` enum: `END_DATE`, `START_DATE`, `TITLE`, `DATE_ADDED`
    - Add `LibrarySortOrder` enum: `ASC`, `DESC`
  - [x] 1.2 Add fields to User model
    - Add `librarySortBy LibrarySortBy @default(END_DATE)`
    - Add `librarySortOrder LibrarySortOrder @default(DESC)`
  - [x] 1.3 Create and run migration
    - `npx prisma migrate dev --name add_library_sort_preferences`
    - Verify migration applies cleanly

**Acceptance Criteria:**
- Enums and fields exist in schema ✅
- Migration runs without errors ✅
- Default values applied correctly ✅

### Backend API Layer

#### Task Group 2: Preferences API Update ✅
**Dependencies:** Task Group 1

- [x] 2.0 Complete API updates for sort preferences
  - [x] 2.1 Update PATCH `/api/user/preferences/route.ts`
    - Accept `librarySortBy` and `librarySortOrder` in request body
    - Add validation for enum values (like dashboardLayout validation)
    - Include in Prisma update and response
  - [x] 2.2 Verify API works
    - Test with curl/Postman to confirm preferences save

**Acceptance Criteria:**
- API accepts and validates sort preferences ✅
- Preferences persist to database ✅
- Invalid values return 400 error ✅

#### Task Group 3: Dashboard Query Updates ✅
**Dependencies:** Task Group 1

- [x] 3.0 Complete server-side sorting logic
  - [x] 3.1 Update user preferences fetch in `dashboard/page.tsx`
    - Add `librarySortBy` and `librarySortOrder` to select clause
  - [x] 3.2 Implement dynamic orderBy logic
    - Build orderBy array based on user preferences
    - Keep status as primary sort
    - Map sort fields: END_DATE→finishDate, START_DATE→startDate, TITLE→edition.book.title, DATE_ADDED→createdAt
  - [x] 3.3 Handle null dates in sorting
    - For null finishDate/startDate, use Prisma `nulls: 'first'` or `nulls: 'last'` based on sort order
  - [x] 3.4 Pass sort preferences to DashboardClient
    - Add `initialSortBy` and `initialSortOrder` props

**Acceptance Criteria:**
- Books sorted by user preference on page load ✅
- Status grouping maintained ✅
- Null dates handled correctly (appear at top for DESC) ✅

### Frontend Components

#### Task Group 4: SortDropdown Component ✅
**Dependencies:** None (can develop in parallel)

- [x] 4.0 Complete SortDropdown component
  - [x] 4.1 Create `src/components/dashboard/SortDropdown.tsx`
    - Props: `currentSortBy`, `currentSortOrder`, `onSortChange`
    - Use Headless UI Listbox for accessibility
  - [x] 4.2 Implement sort options
    - Options: "End Date", "Start Date", "Title", "Date Added"
    - Show current selection
    - Show sort direction indicator (↑/↓)
  - [x] 4.3 Implement sort order toggle
    - Clicking same option toggles ASC/DESC
    - Clicking different option uses default order for that field
  - [x] 4.4 Style consistently with LayoutToggle
    - Use `bg-muted rounded-lg` container
    - Match button/dropdown styling

**Acceptance Criteria:**
- Dropdown renders with all options ✅
- Current selection visually indicated ✅
- Sort order toggles when same option clicked ✅
- Accessible via keyboard ✅

#### Task Group 5: DashboardClient Integration ✅
**Dependencies:** Task Groups 2, 3, 4

- [x] 5.0 Complete DashboardClient updates
  - [x] 5.1 Add sort state and props
    - Add `initialSortBy` and `initialSortOrder` props to interface
    - Add state: `const [sortBy, setSortBy] = useState(initialSortBy)`
    - Add state: `const [sortOrder, setSortOrder] = useState(initialSortOrder)`
  - [x] 5.2 Implement handleSortChange function
    - Follow `handleLayoutChange` pattern (lines 56-78)
    - Optimistic UI update
    - Call `/api/user/preferences` with new sort values
    - Trigger page refresh to re-fetch sorted data
  - [x] 5.3 Render SortDropdown in header
    - Position next to LayoutToggle
    - Only show when `activeTab === 'books'`

**Acceptance Criteria:**
- Sort changes update UI immediately (optimistic) ✅
- Sort preferences saved to database ✅
- Page refreshes to show new sort order ✅
- Dropdown hidden on charts tab ✅

### Testing

#### Task Group 6: Verification ✅
**Dependencies:** Task Groups 1-5

- [x] 6.0 Complete feature verification
  - [x] 6.1 Manual testing
    - Test all sort options work correctly
    - Test sort order toggle works
    - Test preference persists across page reloads
    - Test null date handling
  - [x] 6.2 Run existing tests
    - `npm run lint` - Passed (3 warnings, 0 errors)
    - `npm run build` - Passed
    - Verify no regressions

**Acceptance Criteria:**
- All sort options function correctly ✅
- Preferences persist across sessions ✅
- Build passes without errors ✅

## Execution Order

1. **Database Layer** (Task Group 1) - Must complete first ✅
2. **Backend + Frontend in Parallel**:
   - Task Group 2: API updates ✅
   - Task Group 3: Dashboard query updates ✅
   - Task Group 4: SortDropdown component (can start immediately) ✅
3. **Integration** (Task Group 5) - After groups 2, 3, 4 ✅
4. **Verification** (Task Group 6) - Final step ✅

## File Reference

Key files modified:
- `prisma/schema.prisma` - Added enums and fields
- `prisma/migrations/20260120211702_add_library_sort_preferences/migration.sql` - Migration created
- `src/app/api/user/preferences/route.ts` - Accepts sort preferences
- `src/app/dashboard/page.tsx` - Dynamic orderBy logic with buildOrderBy function
- `src/components/dashboard/DashboardClient.tsx` - State, handler, and SortDropdown integration
- `src/components/dashboard/SortDropdown.tsx` - New component created

Pattern references:
- `src/components/dashboard/LayoutToggle.tsx` - UI styling pattern
- `src/app/api/user/preferences/route.ts` - API validation pattern

## Implementation Complete

All task groups completed successfully on 2026-01-20.
