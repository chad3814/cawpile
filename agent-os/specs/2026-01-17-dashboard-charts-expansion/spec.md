# Specification: Dashboard Charts Expansion

## Goal
Expand the dashboard charts system from 2 implemented charts to 9 total charts, adding new visualizations for pages read, DNF tracking, genres, acquisition methods, and diversity representation metrics.

## User Stories
- As a reader, I want to see stacked bars showing completed vs DNF books per month so that I can understand my reading completion patterns
- As a reader, I want to visualize my reading diversity (LGBTQ+, disability, POC authors) so that I can track my diverse reading goals

## Specific Requirements

**Stacked Bar Chart Enhancement (Books per Month)**
- Convert existing `BooksPerMonthChart` from simple bar to stacked bar
- Bottom segment: COMPLETED books (blue - `CHART_COLORS.books`)
- Top segment: DNF books (red - `CHART_COLORS.dnf`)
- Modify API response to return `{ month, completed, dnf }` instead of `{ month, value }`
- Update `BaseBarChart` to support multiple data keys with stacked rendering
- Tooltip should show both values when hovering

**Pages per Month Chart (New Bar Chart)**
- Sum `GoogleBook.pageCount` for books finished in each month
- Filter: Exclude books where `UserBook.format` includes AUDIOBOOK
- Include only COMPLETED and DNF status books
- Handle null pageCount by excluding those books from sum
- Use `CHART_COLORS.pages` (emerald-500) for bar color

**DNF per Month Chart (New Bar Chart)**
- Count books with status='DNF' grouped by finishDate month
- Reuse `createEmptyMonthlyData` and `processMonthlyData` processors
- Use `CHART_COLORS.dnf` (red-500) for bar color
- Display "No DNF books this year" for empty state

**Main Genres Chart (New Pie Chart)**
- Query distinct `Book.primaryGenre` values for user's completed/DNF books
- Filter: Only include books where `primaryGenre IS NOT NULL`
- Do NOT parse `GoogleBook.categories` as fallback
- Join through `UserBook` -> `Edition` -> `Book` to access `primaryGenre`
- Show all unique genres (no "Other" aggregation needed unless >7)

**Acquisition Method Chart (New Pie Chart - replaces "Reading Type")**
- Query `UserBook.acquisitionMethod` for completed/DNF books
- Show ALL unique values as separate segments (no "Other" grouping)
- Include: "Purchased", "Library", "FriendBorrowed", "Gift", and any custom user values
- Handle null by excluding from chart (not as "Unknown" segment)
- Use categorical colors from `CHART_COLORS.categorical`

**LGBTQ+ Representation Chart (New Pie Chart)**
- Query `UserBook.lgbtqRepresentation` field (note: schema field is `lgbtqRepresentation`)
- Valid values: "Yes", "No", "Unknown"
- Filter: Exclude NULL values entirely (only show books with explicit values)
- Use 3-color palette: green (Yes), gray (No), blue (Unknown)

**Disability Representation Chart (New Pie Chart)**
- Query `UserBook.disabilityRepresentation` field
- Same structure as LGBTQ+ chart: "Yes", "No", "Unknown"
- Exclude NULL values entirely
- Use consistent 3-color palette with LGBTQ+ chart

**POC Authors Chart (New Pie Chart)**
- Query `UserBook.authorPoc` field (note: schema field is `authorPoc`, not `pocAuthor`)
- Same structure: "Yes", "No", "Unknown"
- Exclude NULL values entirely
- Use consistent 3-color palette

**New Authors Chart (New Pie Chart)**
- Query `UserBook.isNewAuthor` field (boolean, not string)
- Transform boolean to display labels: true="Yes", false="No", null=excluded
- Filter: Exclude NULL values entirely
- Use 2-color palette since no "Unknown" option for boolean

## Existing Code to Leverage

**BaseBarChart Component (`src/components/charts/BaseBarChart.tsx`)**
- Extend to support multiple data keys for stacked bar rendering
- Add optional `stackedKeys` prop and `Legend` component from Recharts
- Existing tooltip pattern can be extended for multi-value display

**BasePieChart Component (`src/components/charts/BasePieChart.tsx`)**
- Reuse directly for all 6 new pie charts without modification
- Already supports `colors` prop for custom color arrays
- Already handles empty data gracefully

**Chart API Pattern (`src/app/api/charts/books-per-month/route.ts`)**
- Follow same structure: getCurrentUser(), year param, Prisma query, JSON response
- Reuse `createEmptyMonthlyData` and `processMonthlyData` for monthly charts
- Response format: `{ data: [], year: number, total: number }`

**ChartDataContext (`src/contexts/ChartDataContext.tsx`)**
- No modifications needed - context already supports any chart type string
- Cache key pattern `${chartType}-${year}` works for all new charts
- 30-minute TTL applies automatically

**ChartsTab Layout (`src/components/charts/ChartsTab.tsx`)**
- Replace placeholder divs with new chart components
- Change "Reading Type" to "Acquisition Method"
- Add 3 new ChartCards for representation charts (LGBTQ+, Disability, POC Authors, New Authors)
- Grid handles odd number of charts (9 total) gracefully

## Out of Scope
- Interactive drill-down or click-through on chart segments
- Custom date range selection beyond year picker
- Export/download chart data as CSV or image
- Comparison views between multiple years
- Goal tracking or progress indicators
- Mobile-specific chart optimizations
- Chart color theme customization by user
- Real-time updates without page refresh
- Caching strategy changes to ChartDataContext
- Changes to the 2-column grid layout structure
