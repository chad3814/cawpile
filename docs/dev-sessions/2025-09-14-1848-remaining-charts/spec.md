# Dev Session Spec: Remaining Charts Implementation

## Session Details
- **Date**: 2025-09-14 18:48
- **Branch**: charts
- **Focus**: Implementing remaining 8 charts from Phase 1

## Objective
Complete the Phase 1 charts implementation by adding the remaining 8 charts to the existing charts infrastructure.

## Requirements

### Remaining Charts to Implement

#### Bar Charts (Monthly Data)

1. **Pages per Month**
   - Sum total pages from completed books per month
   - Handle missing page counts by looking up from other editions
   - Apply month trimming logic
   - Format as "1.2k" for large numbers

2. **DNF per Month**
   - Count books with status = 'DNF' per month
   - Use finishDate for grouping
   - Apply month trimming logic
   - Use red color (CHART_COLORS.dnf)

3. **Hours Listened per Month**
   - Filter for AUDIOBOOK format only
   - Calculate hours from progress percentage
   - Use audiobookDuration when available (default 10 hours)
   - Show asterisk for estimates
   - Display with one decimal place

#### Pie Charts

4. **DNF Reasons**
   - Filter books with status = 'DNF' and dnfReason not null
   - Group by dnfReason
   - Apply top 7 + other logic
   - Show reason and count in tooltip

5. **Reading Type**
   - Check isReread field
   - Two segments: "Reread" vs "First Time"
   - Handle all first-time reads case
   - Use distinct colors

6. **Book Clubs**
   - Group by bookClubName (not null)
   - Include "No Club" category for null values
   - Apply top 7 + other logic
   - Handle long club names in display

7. **Readathons**
   - Group by readathonName (not null)
   - Include "No Readathon" category for nulls
   - Apply top 7 + other logic
   - Handle long readathon names

8. **Main Genres**
   - Use primaryGenre field from Book model
   - Apply top 7 + other logic
   - Handle null/unknown genres
   - Use genre-appropriate colors if possible

### Technical Requirements

#### All Charts Must:
- Filter data by selected year
- Show appropriate loading states (skeleton loaders)
- Display "No data available" for empty states
- Update when year selector changes
- Handle errors gracefully
- Use existing base components

#### API Endpoints Must:
- Check user authentication
- Accept year as query parameter
- Return data in correct format for charts
- Handle missing/null data appropriately
- Apply proper aggregation logic

#### Data Processing Rules:
- **Monthly Bar Charts**: Apply processMonthlyData() for trimming
- **Pie Charts**: Apply aggregatePieData() for top 7 + other
- **All Charts**: Filter to selected calendar year only

## Implementation Strategy

### For Each Chart:
1. Create API endpoint at `/api/charts/[chart-name]/route.ts`
2. Create component at `/components/charts/[ChartName]Chart.tsx`
3. Add to ChartsTab grid in correct position
4. Test with real data
5. Verify empty states and error handling

### Reuse Patterns From:
- `BooksPerMonthChart` for bar charts
- `BookFormatChart` for pie charts
- Existing API endpoints for structure

## Success Criteria
- [ ] All 8 charts displaying real data
- [ ] Charts respond to year selector
- [ ] Proper loading and empty states
- [ ] No console errors
- [ ] Data accurately reflects database
- [ ] Month trimming working for bar charts
- [ ] Top 7 + other working for pie charts
- [ ] Audiobook hour estimates marked appropriately

## Notes
- Foundation already complete from previous session
- Focus only on chart implementation
- No need to modify infrastructure
- Use existing color scheme and formatters
- Maintain consistency with existing charts