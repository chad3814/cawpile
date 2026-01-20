# Requirements: DNF Books Chart Date Fix

## Problem Statement
DNF'd (Did Not Finish) books don't have an ending date set, so they don't show up in the charts that filter by `finishDate`/`endDate`.

## Decisions

### 1. Date Field Strategy
- **Decision**: Create a migration that sets the `endDate` for all currently DNF'd books (use `updatedAt` as the value)
- **Future behavior**: When a book is marked as DNF, automatically set `endDate` to the current date
- **Editability**: The DNF date should be editable in the Edit Details modal

### 2. Chart Fixes Scope
- **Decision**: No changes needed to chart API routes
- **Rationale**: Charts already query by `finishDate`/`endDate`. Once DNF books have that field populated, they'll appear automatically

### 3. Pages Chart Handling
- **Decision**:
  - If there was progress before DNF, use that progress to calculate pages read
  - If there is no progress (0%), don't include the book in the pages chart
- **Rationale**: More accurate representation of actual pages read

### 4. DNF Date UI Field
- **Decision**: Yes, add UI to collect DNF date when marking a book as DNF
- **Default value**: Current date
- **Location**:
  - AddBookWizard: When user selects "No, I did not finish (DNF)"
  - EditBookModal: When changing status to DNF or editing existing DNF book

### 5. Available Years Route
- **Decision**: No change needed
- **Rationale**: Already considers both `finishDate` and `startDate`

### 6. Out of Scope
- Changes to chart API query logic (not needed)
- Any other features not explicitly listed above

## Implementation Summary

1. **Database Migration**: Set `endDate` for all existing DNF books using their `updatedAt` timestamp
2. **AddBookWizard**: When DNF is selected, show date picker defaulting to today
3. **EditBookModal**: Allow editing the end date for DNF books
4. **Backend Logic**: When status changes to DNF, auto-set `endDate` to current date if not provided
5. **Pages Chart**: Only include DNF books that have progress > 0%

## Visual Assets
None provided.
