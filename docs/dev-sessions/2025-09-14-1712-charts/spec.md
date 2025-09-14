# Dev Session Spec: Adding Charts and Graphs

## Session Details
- **Date**: 2025-09-14 17:12
- **Branch**: charts
- **Focus**: Adding charts and graphs functionality

## Objective
Add a Charts tab to the dashboard alongside the existing Books tab, providing users with comprehensive data visualizations of their reading habits and statistics for the current and previous years.

## Requirements

### Phase 1 Charts (First 10)
1. **Books per Month** - Bar chart showing books read per month (including DNF) for selected year
2. **Pages per Month** - Bar chart showing pages read per month for selected year
3. **DNF per Month** - Bar chart showing books DNF'd per month for selected year
4. **Hours Listened per Month** - Bar chart showing audiobook hours per month for selected year
5. **DNF Reasons** - Pie chart showing reasons for DNF'ing books
6. **Book Format** - Pie chart showing physical vs ebook vs audiobook distribution
7. **Reading Type** - Pie chart showing re-reads vs first-time reads
8. **Book Clubs** - Pie chart showing which book club books were read for
9. **Readathons** - Pie chart showing which readathon books were read for
10. **Main Genres** - Pie chart showing primary genre distribution

### Phase 2 Charts (Future Session)
11. Page Length Distribution - Bar chart (50-page buckets)
12. Fiction vs Non-Fiction - Pie chart
13. Publishers - Bar chart
14. Acquisition Method - Pie chart
15. Star Ratings - Pie chart
16. Publication Years - Pie chart
17. LGBTQ+ Representation - Pie chart
18. Disability Representation - Pie chart
19. Author POC - Pie chart
20. Books per Author - Pie chart
21. New vs Returning Authors - Pie chart

### User Interface
- **Navigation**: Add "Charts" tab to dashboard alongside existing "Books" tab
- **Layout**:
  - Desktop: 2-column grid
  - Mobile: Single column
  - All charts uniform size
- **Year Selection**: Dropdown selector showing all years with user book data
- **Data Scope**: All charts filter to selected calendar year only

### Chart Behavior
- **Interactivity**:
  - Hover for tooltips with exact values (desktop)
  - Tap for modal with details (mobile)
- **Empty States**: Show "No data available" message when applicable
- **Loading**: Chart-appropriate skeleton loaders (bar or pie shape)
- **100% Categories**: Still display as pie chart when single category dominates

### Data Display Rules

#### Bar Charts (Monthly)
- Show only months that have occurred in current year
- Include months with zero values within the range
- Trim trailing months with zero values
- Example: If current month is September with no data in May, July, Aug, Sept:
  - Show: Jan-Jul (including May with 0)
  - Hide: Aug-Sept

#### Pie Charts
- Maximum 7 primary segments
- Group remaining items into "Other" category if more than 7
- Show percentages and counts in tooltips/modals

#### Special Calculations
- **Hours Listened**:
  - Use actual audiobook duration from Google Books when available
  - Default to 10 hours if duration unknown (mark with asterisk as estimate)
  - Calculate from stored percentage completion
- **Star Ratings**: Use existing CAWPILE average to star conversion (whole stars)
- **Page Counts**:
  - Use GoogleBook pageCount when available
  - If missing, look up from other editions (prefer same format)
  - Exclude from chart if no page count found

### Technical Implementation

#### Charting Library
- Use Nivo (or similar) for animated, React-native charts
- Follow existing Cawpile color scheme
- Responsive design with proper mobile touch handling

#### Data Architecture
- **New Fields Required**:
  - `publisher` field in GoogleBook model (extract from Google Books API)
  - `primaryGenre` field (populate from first category in Google Books)
- **API Strategy**:
  - Lazy load individual charts as user scrolls
  - Cache data for session duration
  - Refresh only on book additions/edits

#### Performance
- Implement viewport-based lazy loading
- Session-level caching
- Individual API endpoints per chart type

### Future Enhancements (Separate Sessions)
- Remaining 11 charts (Phase 2)
- Animated summary statistics header
- Export functionality (PNG, PDF, CSV)
- Sharing capabilities
- Comparative analytics (year-over-year)

## Success Criteria
- [ ] Charts tab accessible from dashboard
- [ ] All 10 Phase 1 charts rendering with correct data
- [ ] Proper responsive behavior on mobile/desktop
- [ ] Year selector functioning with historical data
- [ ] Interactive tooltips/modals working
- [ ] Loading states and empty states handled gracefully
- [ ] Data correctly filtered to selected year
- [ ] Session caching preventing redundant API calls

## Technical Considerations
- Must be compatible with Next.js 15.5 and React 19
- Maintain existing TypeScript type safety
- Follow current project structure and patterns
- Ensure accessibility standards for data visualizations
- Consider bundle size impact of charting library