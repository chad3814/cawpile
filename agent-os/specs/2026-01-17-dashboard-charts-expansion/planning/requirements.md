# Dashboard Charts Expansion - Requirements

## Overview
Expand the dashboard charts system with new visualizations and enhance existing ones.

## Charts to Implement

### 1. Books per Month (Enhancement)
- **Type**: Stacked Bar Chart
- **Change**: Convert from simple bar to stacked bar
- **Segments**:
  - Bottom: Completed books (blue)
  - Top: DNF books (red)
- **X-axis**: Months
- **Y-axis**: Book count

### 2. Pages per Month (New)
- **Type**: Bar Chart
- **Data**: Sum of page counts from `GoogleBook.pageCount`
- **Filter**: Exclude audiobooks (AUDIOBOOK format)
- **Scope**: Completed and DNF books only

### 3. DNF per Month (New)
- **Type**: Bar Chart
- **Data**: Count of books with DNF status per month
- **X-axis**: Months
- **Y-axis**: DNF count

### 4. Main Genres (New)
- **Type**: Pie Chart
- **Data Source**: `Book.primaryGenre` field only
- **Filter**: Only include books where `primaryGenre` is set (not null)
- **No fallback**: Do not parse `GoogleBook.categories`

### 5. Acquisition Method (New - replaces "Reading Type" placeholder)
- **Type**: Pie Chart
- **Data Source**: `UserBook.acquisitionMethod` field
- **Grouping**: Show ALL unique values as separate segments (no "Other" grouping)
- **Include**: "Purchased", "Library", "FriendBorrowed", "Gift", and any custom values

### 6. LGBTQ+ Representation (New)
- **Type**: Pie Chart
- **Data Source**: `UserBook.lgbtqRep` field
- **Values**: "Yes", "No", "Unknown"
- **Filter**: Exclude NULL values entirely

### 7. Disability Representation (New)
- **Type**: Pie Chart
- **Data Source**: `UserBook.disabilityRep` field
- **Values**: "Yes", "No", "Unknown"
- **Filter**: Exclude NULL values entirely

### 8. POC Authors (New)
- **Type**: Pie Chart
- **Data Source**: `UserBook.pocAuthor` field
- **Values**: "Yes", "No", "Unknown"
- **Filter**: Exclude NULL values entirely

### 9. New Authors (New)
- **Type**: Pie Chart
- **Data Source**: `UserBook.newAuthor` field
- **Values**: "Yes", "No", "Unknown"
- **Filter**: Exclude NULL values entirely

## Layout
- **Grid**: Keep existing 2-column grid layout
- **Uneven row**: Acceptable if chart count is odd
- **Total charts**: 9 (2 existing enhanced + 7 new)

## Technical Notes

### Existing Patterns to Follow
- Chart components: `src/components/charts/`
- API endpoints: `src/app/api/charts/`
- Caching: `ChartDataContext` with 30-minute TTL
- Pie data processing: `aggregatePieData` processor

### Database Fields (UserBook model)
- `lgbtqRep`: String | null ("Yes", "No", "Unknown")
- `disabilityRep`: String | null ("Yes", "No", "Unknown")
- `pocAuthor`: String | null ("Yes", "No", "Unknown")
- `newAuthor`: String | null ("Yes", "No", "Unknown")
- `acquisitionMethod`: String | null
- `format`: Enum (PHYSICAL, EBOOK, AUDIOBOOK, GRAPHIC_NOVEL)

### Database Fields (Book model)
- `primaryGenre`: String | null

### Database Fields (GoogleBook model)
- `pageCount`: Int | null

## Out of Scope
- Nothing explicitly excluded - all charts in scope

## Visual Assets
- None provided
