# Research Notes: Library Sort by End Date

## Current Implementation

### Dashboard Page (`src/app/dashboard/page.tsx`)
- Books are fetched server-side via Prisma
- Current ordering: `orderBy: [{ status: 'asc' }, { createdAt: 'desc' }]`
- Books are passed to `DashboardClient` component

### DashboardClient (`src/components/dashboard/DashboardClient.tsx`)
- Receives `books` array as props
- Has layout toggle (GRID/TABLE) - persisted to user preferences
- Has tab navigation (books/charts)
- Uses `ViewSwitcher` to display books

### Data Model (BookData interface)
- `finishDate: Date | null` - the end date field
- `startDate: Date | null`
- `createdAt: Date`
- `status: BookStatus` (WANT_TO_READ, READING, COMPLETED, DNF)

### Current Sort Behavior
1. Primary: status ascending (likely COMPLETED, DNF, READING, WANT_TO_READ)
2. Secondary: createdAt descending (newest first)

## Questions to Clarify

1. Should this be the default sort, or a user-selectable sort option?
2. Should the sort apply to all books or only completed/DNF books?
3. Books without finishDate (WANT_TO_READ, READING) - where should they appear?
4. Should this be persisted as a user preference like the layout toggle?
