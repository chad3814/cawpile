# Specification: Library Sort by End Date

## Goal
Allow users to sort their library by end date (descending by default) and provide a dropdown to switch between different sort options, with the preference persisted to the database.

## User Stories
- As a reader, I want my library sorted by end date so I can see my most recently finished books first
- As a reader, I want to change the sort order to find books by title, start date, or date added
- As a reader, I want my sort preference saved so it persists across sessions

## Specific Requirements

**Database Schema Changes**
- Add `librarySortBy` enum to Prisma schema with values: `END_DATE`, `START_DATE`, `TITLE`, `DATE_ADDED`
- Add `librarySortOrder` enum with values: `ASC`, `DESC`
- Add `librarySortBy` field to User model with default `END_DATE`
- Add `librarySortOrder` field to User model with default `DESC`
- Create migration for new fields

**API Updates (`/api/user/preferences`)**
- Extend PATCH endpoint to accept `librarySortBy` and `librarySortOrder` in request body
- Validate that values match the enum options
- Return updated sort preferences in response
- Follow existing pattern at lines 16-36 for dashboardLayout

**Dashboard Page Server-Side Sorting**
- Read user's `librarySortBy` and `librarySortOrder` preferences
- Modify Prisma query `orderBy` based on preferences:
  - `END_DATE`: `finishDate` (null values treated as current date)
  - `START_DATE`: `startDate` (null values treated as current date)
  - `TITLE`: `edition.book.title`
  - `DATE_ADDED`: `createdAt`
- Keep status grouping as primary sort, apply user sort as secondary
- Pass sort preferences to DashboardClient for UI state

**Sort Dropdown Component**
- Create new `SortDropdown` component in `src/components/dashboard/`
- Position next to LayoutToggle in DashboardClient header
- Options: "End Date", "Start Date", "Title", "Date Added"
- Show current selection with visual indicator
- Toggle sort order (asc/desc) when same option clicked again
- Use Headless UI Listbox for accessible dropdown
- Style consistently with LayoutToggle (bg-muted, rounded-lg)

**DashboardClient Updates**
- Add `initialSortBy` and `initialSortOrder` props
- Add state for current sort preferences
- Add `handleSortChange` function following `handleLayoutChange` pattern (lines 56-78)
- Render SortDropdown next to LayoutToggle when on books tab

**Null Date Handling**
- For `END_DATE` sort: books without `finishDate` sort as if date is current time (appear at top when DESC)
- For `START_DATE` sort: books without `startDate` sort as if date is current time
- Implement in Prisma query using `COALESCE` or handle in application layer

## Existing Code to Leverage

**LayoutToggle Pattern**
- `src/components/dashboard/LayoutToggle.tsx` - UI component pattern with toggle buttons
- Use similar styling: `bg-muted rounded-lg p-1`, button states with `bg-background text-foreground shadow-sm`

**Preferences API Pattern**
- `src/app/api/user/preferences/route.ts` - PATCH endpoint structure
- Validation pattern at lines 19-25
- Prisma update pattern at lines 28-36

**DashboardClient State Pattern**
- `src/components/dashboard/DashboardClient.tsx` - State management and optimistic updates
- `handleLayoutChange` function (lines 56-78) for API call pattern

**Dashboard Page Query**
- `src/app/dashboard/page.tsx` - Current orderBy structure at lines 36-43
- User preferences fetch at lines 14-20

## Out of Scope
- Sorting within the "Currently Reading" section (separate component)
- Multi-column sorting (only single sort field)
- Custom sort order per status group
- Filtering options (only sorting)
- Remembering sort per view (GRID vs TABLE have same sort)
- Paginating sorted results
- Sort by rating or other book metadata
