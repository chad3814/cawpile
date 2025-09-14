# Development Plan: Charts and Graphs Implementation

## Overview
This plan breaks down the implementation of Phase 1 charts feature into small, incremental steps that build upon each other. Each step is designed to be safe, testable, and integrate immediately with previous work.

## Architecture Decisions
- **Charting Library**: Recharts (React-first, good TypeScript support, responsive)
- **State Management**: React Context for chart data caching
- **Data Fetching**: Individual API endpoints with React Query for caching
- **Styling**: TailwindCSS with existing color scheme

## Implementation Phases

### Phase 1: Database Schema Updates
Add required fields for chart data that don't currently exist.

### Phase 2: Foundation Setup
Create the basic infrastructure for the charts feature without any actual charts.

### Phase 3: Tab Navigation
Add the Charts tab to the dashboard with proper routing and state management.

### Phase 4: Chart Components Infrastructure
Build reusable chart components and utilities.

### Phase 5: API Endpoints
Create data fetching endpoints for each chart type.

### Phase 6: Individual Charts Implementation
Implement each of the 10 charts one by one.

### Phase 7: Responsive Design & Polish
Add mobile responsiveness, loading states, and final polish.

---

## Detailed Step-by-Step Implementation

### Step 1: Database Schema Updates
**Goal**: Add missing fields to support chart data requirements.

**Tasks**:
1. Add `publisher` field to GoogleBook model
2. Add `primaryGenre` field to Book model
3. Add `audiobookDuration` field to GoogleBook model
4. Create and run migration
5. Update Prisma types

---

### Step 2: Install and Configure Charting Library
**Goal**: Set up Recharts with TypeScript support.

**Tasks**:
1. Install recharts and @types/recharts
2. Create a test component to verify installation
3. Set up color constants matching Cawpile theme
4. Create chart configuration utilities

---

### Step 3: Create Dashboard Tab Navigation
**Goal**: Add Charts tab alongside Books tab on dashboard.

**Tasks**:
1. Create tab navigation component
2. Add state management for active tab
3. Update dashboard page layout
4. Preserve existing Books functionality

---

### Step 4: Create Chart Container Layout
**Goal**: Build the responsive grid layout for charts.

**Tasks**:
1. Create ChartGrid component with 2-column desktop layout
2. Add single-column mobile layout
3. Create ChartCard wrapper component
4. Add intersection observer for lazy loading setup

---

### Step 5: Build Year Selector Component
**Goal**: Create dropdown for year selection.

**Tasks**:
1. Create YearSelector component
2. Add API endpoint to fetch available years
3. Integrate with chart data context
4. Store selected year in URL params

---

### Step 6: Create Chart Data Context
**Goal**: Set up caching and state management for chart data.

**Tasks**:
1. Create ChartDataProvider context
2. Add caching logic with session storage
3. Create data fetching hooks
4. Add invalidation on book changes

---

### Step 7: Build Skeleton Loaders
**Goal**: Create loading states for charts.

**Tasks**:
1. Create BarChartSkeleton component
2. Create PieChartSkeleton component
3. Add shimmer animation
4. Integrate with ChartCard wrapper

---

### Step 8: Create Base Chart Components
**Goal**: Build reusable chart primitives.

**Tasks**:
1. Create BaseBarChart component with tooltips
2. Create BasePieChart component with tooltips
3. Add mobile touch handling for modals
4. Create ChartTooltip and ChartModal components

---

### Step 9: Build Data Transformation Utilities
**Goal**: Create utilities to transform raw data for charts.

**Tasks**:
1. Create month data processor for bar charts
2. Create pie chart data aggregator (top 7 + other)
3. Add date range filtering utilities
4. Create formatters for display values

---

### Step 10: API Endpoint - Books per Month
**Goal**: Create first chart data endpoint.

**Tasks**:
1. Create `/api/charts/books-per-month` endpoint
2. Add year filtering
3. Include DNF books
4. Test with sample data

---

### Step 11: Implement Books per Month Chart
**Goal**: Create first working chart.

**Tasks**:
1. Create BooksPerMonthChart component
2. Connect to API endpoint
3. Apply month trimming logic
4. Wire into chart grid

---

### Step 12: API Endpoint - Pages per Month
**Goal**: Create pages tracking endpoint.

**Tasks**:
1. Create `/api/charts/pages-per-month` endpoint
2. Handle missing page counts
3. Look up page counts from other editions
4. Sum pages by month

---

### Step 13: Implement Pages per Month Chart
**Goal**: Add second bar chart.

**Tasks**:
1. Create PagesPerMonthChart component
2. Connect to API endpoint
3. Apply same month display logic
4. Add to chart grid

---

### Step 14: API Endpoint - DNF per Month
**Goal**: Create DNF tracking endpoint.

**Tasks**:
1. Create `/api/charts/dnf-per-month` endpoint
2. Filter for DNF status only
3. Group by month
4. Return formatted data

---

### Step 15: Implement DNF per Month Chart
**Goal**: Add DNF bar chart.

**Tasks**:
1. Create DNFPerMonthChart component
2. Connect to endpoint
3. Apply month trimming
4. Add to grid

---

### Step 16: API Endpoint - Hours Listened
**Goal**: Create audiobook hours endpoint.

**Tasks**:
1. Create `/api/charts/hours-listened` endpoint
2. Calculate hours from percentages
3. Use duration or 10-hour default
4. Add estimation flag for defaults

---

### Step 17: Implement Hours Listened Chart
**Goal**: Add audiobook hours chart.

**Tasks**:
1. Create HoursListenedChart component
2. Show asterisk for estimates
3. Add explanation in tooltip
4. Wire to grid

---

### Step 18: API Endpoint - DNF Reasons
**Goal**: Create first pie chart endpoint.

**Tasks**:
1. Create `/api/charts/dnf-reasons` endpoint
2. Aggregate DNF reasons
3. Group into top 7 + other
4. Calculate percentages

---

### Step 19: Implement DNF Reasons Chart
**Goal**: Add first pie chart.

**Tasks**:
1. Create DNFReasonsChart component
2. Handle empty state (no DNFs)
3. Show counts and percentages
4. Add to grid

---

### Step 20: API Endpoint - Book Format
**Goal**: Create format distribution endpoint.

**Tasks**:
1. Create `/api/charts/book-format` endpoint
2. Group by format type
3. Calculate distribution
4. Return formatted data

---

### Step 21: Implement Book Format Chart
**Goal**: Add format pie chart.

**Tasks**:
1. Create BookFormatChart component
2. Use format-specific colors
3. Handle single format case
4. Add to grid

---

### Step 22: API Endpoint - Reading Type
**Goal**: Create reread tracking endpoint.

**Tasks**:
1. Create `/api/charts/reading-type` endpoint
2. Count rereads vs first reads
3. Calculate percentages
4. Format response

---

### Step 23: Implement Reading Type Chart
**Goal**: Add reread pie chart.

**Tasks**:
1. Create ReadingTypeChart component
2. Show two segments max
3. Handle all first-reads case
4. Add to grid

---

### Step 24: API Endpoint - Book Clubs
**Goal**: Create book club endpoint.

**Tasks**:
1. Create `/api/charts/book-clubs` endpoint
2. Aggregate by club name
3. Apply top 7 + other logic
4. Include "No club" category

---

### Step 25: Implement Book Clubs Chart
**Goal**: Add book club pie chart.

**Tasks**:
1. Create BookClubsChart component
2. Handle no clubs case
3. Show club names clearly
4. Add to grid

---

### Step 26: API Endpoint - Readathons
**Goal**: Create readathon endpoint.

**Tasks**:
1. Create `/api/charts/readathons` endpoint
2. Aggregate by readathon name
3. Apply grouping logic
4. Format response

---

### Step 27: Implement Readathons Chart
**Goal**: Add readathon pie chart.

**Tasks**:
1. Create ReadathonsChart component
2. Handle no readathons case
3. Display names properly
4. Add to grid

---

### Step 28: Update Google Books Import
**Goal**: Extract publisher and primary genre during import.

**Tasks**:
1. Update googleBooks.ts to extract publisher
2. Extract first category as primaryGenre
3. Extract audiobook duration if available
4. Update existing book import flow

---

### Step 29: API Endpoint - Main Genres
**Goal**: Create genre distribution endpoint.

**Tasks**:
1. Create `/api/charts/genres` endpoint
2. Use primaryGenre field
3. Apply top 7 logic
4. Handle missing genres

---

### Step 30: Implement Main Genres Chart
**Goal**: Add final pie chart.

**Tasks**:
1. Create MainGenresChart component
2. Use genre-appropriate colors
3. Handle unknown genre
4. Add to grid

---

### Step 31: Add Empty States
**Goal**: Polish empty data handling.

**Tasks**:
1. Create EmptyChartState component
2. Add friendly messages per chart type
3. Show when no data for year
4. Test with new user scenario

---

### Step 32: Mobile Optimizations
**Goal**: Ensure mobile experience is smooth.

**Tasks**:
1. Test and adjust touch targets
2. Verify modal behavior on mobile
3. Optimize chart text sizes
4. Test on various screen sizes

---

### Step 33: Performance Optimization
**Goal**: Ensure smooth scrolling and loading.

**Tasks**:
1. Implement viewport-based lazy loading
2. Add React.memo to chart components
3. Optimize re-renders
4. Test with large datasets

---

### Step 34: Final Integration & Testing
**Goal**: Ensure everything works together.

**Tasks**:
1. Test year selector with multiple years
2. Verify cache invalidation
3. Test all charts with edge cases
4. Fix any integration issues

---

## LLM Implementation Prompts

### Prompt 1: Database Schema Updates
```
Update the Prisma schema to add the following fields:
1. Add `publisher: String?` to the GoogleBook model
2. Add `primaryGenre: String?` to the Book model
3. Add `audiobookDuration: Int?` (in minutes) to the GoogleBook model

After updating the schema, create and run a migration called "add_chart_fields".
Update any TypeScript types that are affected.
```

### Prompt 2: Install Charting Library
```
Install Recharts for React charting:
1. Run: npm install recharts
2. Create a file `src/lib/charts/colors.ts` that exports a CHART_COLORS constant with colors from the existing Cawpile theme
3. Create `src/lib/charts/config.ts` with default chart configurations (responsive container settings, margin defaults, etc.)
4. Create a simple test component at `src/components/charts/TestChart.tsx` that renders a basic bar chart to verify the setup works
```

### Prompt 3: Dashboard Tab Navigation
```
Update the dashboard to add a Charts tab:
1. Create `src/components/dashboard/TabNavigation.tsx` with two tabs: "Books" and "Charts"
2. Update `src/app/dashboard/page.tsx` to use the tab navigation
3. Add state management for the active tab using useState
4. The Books tab should show the existing dashboard content
5. The Charts tab should show a placeholder "Charts coming soon" message for now
6. Style the tabs to match the existing dashboard design
```

### Prompt 4: Chart Container Layout
```
Create the responsive grid layout for charts:
1. Create `src/components/charts/ChartGrid.tsx` that renders a responsive grid (2 columns desktop, 1 mobile)
2. Create `src/components/charts/ChartCard.tsx` as a wrapper for individual charts with consistent styling
3. Add an `id` prop to ChartCard for intersection observer targeting
4. Set up the basic intersection observer hook in `src/hooks/useIntersectionObserver.ts` for lazy loading
5. The ChartCard should have a consistent height and padding
```

### Prompt 5: Year Selector Component
```
Create a year selector dropdown:
1. Create `src/components/charts/YearSelector.tsx` with a select dropdown
2. Create API endpoint `src/app/api/charts/available-years/route.ts` that returns years with book data
3. The endpoint should query for distinct years from UserBook finishDate and startDate
4. Store the selected year in URL search params for persistence
5. Default to current year if available, otherwise most recent year with data
```

### Prompt 6: Chart Data Context
```
Set up chart data caching context:
1. Create `src/contexts/ChartDataContext.tsx` with a provider for chart data
2. Add session storage caching with a 30-minute TTL
3. Create `useChartData` hook for components to access cached data
4. Add an invalidation method that clears cache when books are modified
5. The context should track loading states per chart type
```

### Prompt 7: Skeleton Loaders
```
Create loading skeleton components:
1. Create `src/components/charts/skeletons/BarChartSkeleton.tsx` with animated bars
2. Create `src/components/charts/skeletons/PieChartSkeleton.tsx` with animated circle
3. Use TailwindCSS animation classes for shimmer effect
4. Both should match the dimensions of actual charts
5. Export from a barrel file at `src/components/charts/skeletons/index.ts`
```

### Prompt 8: Base Chart Components
```
Create reusable base chart components:
1. Create `src/components/charts/BaseBarChart.tsx` using Recharts BarChart
2. Create `src/components/charts/BasePieChart.tsx` using Recharts PieChart
3. Both should accept generic data props and handle tooltips
4. Create `src/components/charts/ChartTooltip.tsx` for custom tooltip styling
5. Create `src/components/charts/ChartModal.tsx` for mobile tap interactions
6. Add proper TypeScript generics for type safety
```

### Prompt 9: Data Transformation Utilities
```
Create data processing utilities:
1. Create `src/lib/charts/processors.ts` with:
   - `processMonthlyData()` to handle month trimming logic for bar charts
   - `aggregatePieData()` to handle top 7 + other grouping
   - `filterByDateRange()` for year filtering
2. Create `src/lib/charts/formatters.ts` with:
   - `formatMonth()` for month labels
   - `formatNumber()` for tooltip values
   - `formatPercentage()` for pie chart labels
3. Add comprehensive TypeScript types for all functions
```

### Prompt 10: Books per Month API
```
Create the books per month endpoint:
1. Create `src/app/api/charts/books-per-month/route.ts`
2. Accept year as query parameter
3. Query UserBook where finishDate is in the specified year
4. Include both COMPLETED and DNF statuses
5. Group by month and count books
6. Apply the month trimming logic (remove trailing zero months)
7. Return data in Recharts format: [{month: 'Jan', count: 5}, ...]
```

### Prompt 11: Books per Month Chart
```
Implement the books per month chart:
1. Create `src/components/charts/BooksPerMonthChart.tsx`
2. Use the BaseBarChart component
3. Fetch data from `/api/charts/books-per-month`
4. Show BarChartSkeleton while loading
5. Handle empty state with "No books completed this year"
6. Add to the ChartGrid in the Charts tab
7. Use ResponsiveContainer from Recharts for responsive sizing
```

### Prompt 12: Pages per Month API
```
Create the pages per month endpoint:
1. Create `src/app/api/charts/pages-per-month/route.ts`
2. Query UserBook with GoogleBook relation for pageCount
3. For missing pageCounts, look up from other editions of same book
4. Prefer editions with same format when looking up
5. Sum total pages per month
6. Apply month trimming logic
7. Return formatted data for chart consumption
```

### Prompt 13: Pages per Month Chart
```
Implement pages per month chart:
1. Create `src/components/charts/PagesPerMonthChart.tsx`
2. Use BaseBarChart with page-specific formatting
3. Format large numbers (e.g., "1.2k" for 1200)
4. Show exact count in tooltip
5. Handle empty state appropriately
6. Add to ChartGrid after books per month chart
```

### Prompt 14: DNF per Month API
```
Create DNF tracking endpoint:
1. Create `src/app/api/charts/dnf-per-month/route.ts`
2. Query UserBook where status = 'DNF'
3. Use finishDate for grouping by month
4. Count DNF books per month
5. Apply month trimming logic
6. Return formatted monthly data
```

### Prompt 15: DNF per Month Chart
```
Implement DNF per month chart:
1. Create `src/components/charts/DNFPerMonthChart.tsx`
2. Use BaseBarChart with DNF-specific color
3. Show "No DNF books this year" for empty state
4. Add helpful tooltip showing book titles if possible
5. Add to ChartGrid
```

### Prompt 16: Hours Listened API
```
Create audiobook hours endpoint:
1. Create `src/app/api/charts/hours-listened/route.ts`
2. Query UserBook where format = 'AUDIOBOOK'
3. Join with GoogleBook for audiobookDuration
4. Calculate hours from progress percentage
5. Use 600 minutes (10 hours) as default if duration missing
6. Add `isEstimate` flag for defaults
7. Group by month and sum hours
8. Apply month trimming
```

### Prompt 17: Hours Listened Chart
```
Implement hours listened chart:
1. Create `src/components/charts/HoursListenedChart.tsx`
2. Show hours with one decimal place
3. Add asterisk to months with estimates
4. Include "* Estimated based on 10-hour average" note if any estimates
5. Show "No audiobooks this year" for empty state
6. Add to ChartGrid
```

### Prompt 18: DNF Reasons API
```
Create DNF reasons pie chart endpoint:
1. Create `src/app/api/charts/dnf-reasons/route.ts`
2. Query UserBook where status = 'DNF' and dnfReason is not null
3. Group by dnfReason and count
4. Sort by count descending
5. Take top 7, group rest as "Other"
6. Calculate percentages
7. Return pie chart data format
```

### Prompt 19: DNF Reasons Chart
```
Implement DNF reasons pie chart:
1. Create `src/components/charts/DNFReasonsChart.tsx`
2. Use BasePieChart component
3. Show reason and count in tooltip
4. Handle case where no DNF books have reasons
5. Use distinct colors for each segment
6. Add to ChartGrid as first pie chart
```

### Prompt 20: Book Format API
```
Create format distribution endpoint:
1. Create `src/app/api/charts/book-format/route.ts`
2. Query UserBook and group by format field
3. Count books per format (HARDCOVER, PAPERBACK, EBOOK, AUDIOBOOK)
4. Calculate percentages
5. Return all formats even if count is 0
6. Order by count descending
```

### Prompt 21: Book Format Chart
```
Implement book format pie chart:
1. Create `src/components/charts/BookFormatChart.tsx`
2. Use format-specific colors (match existing UI if possible)
3. Show format name and count in tooltip
4. Handle single format case (show as 100% pie)
5. Add readable labels for each format
6. Add to ChartGrid
```

### Prompt 22: Reading Type API
```
Create reread tracking endpoint:
1. Create `src/app/api/charts/reading-type/route.ts`
2. Query UserBook and check isReread field
3. Count true vs false/null
4. Label as "Reread" and "First Time"
5. Calculate percentages
6. Return pie chart format
```

### Prompt 23: Reading Type Chart
```
Implement reading type pie chart:
1. Create `src/components/charts/ReadingTypeChart.tsx`
2. Use two distinct colors
3. Show count and percentage in tooltip
4. Handle all first-time reads case
5. Keep it simple with just two segments max
6. Add to ChartGrid
```

### Prompt 24: Book Clubs API
```
Create book club distribution endpoint:
1. Create `src/app/api/charts/book-clubs/route.ts`
2. Query UserBook where bookClubName is not null
3. Group by bookClubName and count
4. Include "No Club" category for null values
5. Apply top 7 + other logic
6. Calculate percentages
7. Return formatted data
```

### Prompt 25: Book Clubs Chart
```
Implement book clubs pie chart:
1. Create `src/components/charts/BookClubsChart.tsx`
2. Show club names clearly (consider truncation for long names)
3. Include count in tooltip
4. Handle no book clubs case
5. Use varied colors for distinction
6. Add to ChartGrid
```

### Prompt 26: Readathons API
```
Create readathon endpoint:
1. Create `src/app/api/charts/readathons/route.ts`
2. Query UserBook where readathonName is not null
3. Group by readathonName
4. Apply top 7 + other grouping
5. Include books with no readathon as separate category
6. Calculate percentages
7. Return formatted data
```

### Prompt 27: Readathons Chart
```
Implement readathons pie chart:
1. Create `src/components/charts/ReadathonsChart.tsx`
2. Handle long readathon names appropriately
3. Show full name in tooltip even if truncated in legend
4. Handle no readathons case
5. Use distinct colors
6. Add to ChartGrid
```

### Prompt 28: Update Google Books Import
```
Update the Google Books import to extract new fields:
1. In `src/lib/googleBooks.ts`, update the import function to:
   - Extract publisher from volumeInfo.publisher
   - Take first item from categories array as primaryGenre
   - Extract audiobook duration if available (look for it in the API response)
2. Update the GoogleBook creation in the database with these fields
3. Add a migration script to backfill existing books with this data
4. Handle cases where these fields don't exist in the API response
```

### Prompt 29: Main Genres API
```
Create genre distribution endpoint:
1. Create `src/app/api/charts/genres/route.ts`
2. Query Book model for primaryGenre field
3. Join with UserBook for year filtering
4. Group by primaryGenre and count
5. Apply top 7 + other logic
6. Handle null/unknown genres
7. Return pie chart format with percentages
```

### Prompt 30: Main Genres Chart
```
Implement main genres pie chart:
1. Create `src/components/charts/MainGenresChart.tsx`
2. Use genre-appropriate colors if possible
3. Handle "Unknown" genre gracefully
4. Show genre and book count in tooltip
5. Consider using a legend for genres with long names
6. Add as the last chart in ChartGrid
```

### Prompt 31: Empty States
```
Add polished empty states for all charts:
1. Create `src/components/charts/EmptyChartState.tsx` that accepts a message prop
2. Update each chart component to use EmptyChartState when no data
3. Add friendly, encouraging messages like:
   - "Start tracking your reading to see insights here!"
   - "No books completed yet this year"
   - "No DNF books this year - great job!"
4. Include a small icon or illustration if appropriate
5. Ensure empty states have the same height as charts for layout consistency
```

### Prompt 32: Mobile Optimizations
```
Optimize charts for mobile devices:
1. Update ChartGrid to be single column on mobile (use Tailwind responsive classes)
2. Adjust chart heights for mobile viewports
3. Test and adjust touch targets (minimum 44x44px)
4. Ensure ChartModal works smoothly on mobile
5. Reduce font sizes appropriately for mobile
6. Test on various mobile screen sizes
7. Add overflow scrolling for legends if needed
```

### Prompt 33: Performance Optimization
```
Optimize performance for smooth experience:
1. Implement intersection observer in ChartGrid to lazy load charts
2. Add React.memo to all chart components
3. Use useMemo for expensive data transformations
4. Implement proper dependency arrays in useEffect hooks
5. Add loading priorities (load visible charts first)
6. Test with 100+ books to ensure smooth scrolling
7. Profile and fix any performance bottlenecks
```

### Prompt 34: Final Integration
```
Complete final integration and testing:
1. Wire all 10 charts into the ChartGrid in the correct order
2. Test year selector with multiple years of data
3. Verify cache invalidation when adding/editing books
4. Test all charts with edge cases:
   - No data
   - Single data point
   - 100% in one category
   - Many small categories
5. Fix any integration issues
6. Ensure consistent styling across all charts
7. Verify loading states and error handling
```