# Requirements: Library Sort by End Date

## Problem Statement
The library on the dashboard currently sorts by status then createdAt. Users want to sort by end date descending to see their most recently finished books first.

## Decisions

### 1. Default vs. Selectable
- **Decision**: Make "end date descending" the new default AND add a sort dropdown for users to change it
- Sort options to include: End Date, Start Date, Title, Date Added

### 2. Scope
- **Decision**: Applies to the library section only (not the "Currently Reading" section which is separate)
- Applies to all statuses in the library including WANT_TO_READ, COMPLETED, and DNF
- Note: Currently Reading books are displayed in a separate section

### 3. Books Without End Date (null handling)
- **Decision**: Books without `finishDate` should sort as if the date is the current time
- This means null dates appear at the top when sorting descending (most recent)
- Same logic applies to null `startDate` when sorting by start date

### 4. Persistence
- **Decision**: Yes, save the sort preference to the database like the layout toggle
- Will need a new field on the User model (e.g., `librarySortBy` and `librarySortOrder`)

### 5. Status Grouping
- **Decision**: Keep the existing status grouping, sort within each group by the selected sort field
- Order: COMPLETED, DNF, WANT_TO_READ (or current grouping order)
- Within each status group, apply the user's selected sort

## Implementation Summary

1. **Database**: Add `librarySortBy` and `librarySortOrder` fields to User model
2. **API**: Update `/api/user/preferences` to accept sort preferences
3. **Dashboard Page**: Apply sort based on user preference when fetching books
4. **UI**: Add sort dropdown next to the layout toggle
5. **Client**: Handle sort changes with optimistic updates (like layout toggle)

## Sort Options
- End Date (default) - `finishDate`
- Start Date - `startDate`
- Title - `edition.book.title`
- Date Added - `createdAt`

## Sort Order
- Descending (default for dates)
- Ascending (default for title)

## Visual Assets
None provided.
