# Task Breakdown: Dashboard Charts Expansion

## Overview
Total Tasks: 26
Total Charts: 10 (2 enhanced + 8 new)

## Task List

### Shared Infrastructure

#### Task Group 1: Color Configuration and Processor Updates
**Dependencies:** None

- [x] 1.0 Complete shared infrastructure updates
  - [x] 1.1 Add representation chart colors to `src/lib/charts/colors.ts`
    - Add `representation` color set for Yes/No/Unknown values
    - Yes: green (`#10b981` emerald-500)
    - No: gray (`#6b7280` gray-500)
    - Unknown: blue (`#3b82f6` blue-500)
    - Add `newAuthor` 2-color set (Yes/No only, no Unknown)
  - [x] 1.2 Create stacked monthly data processor in `src/lib/charts/processors.ts`
    - Add `StackedMonthlyData` interface: `{ month: string; completed: number; dnf: number }`
    - Add `createEmptyStackedMonthlyData(year: number)` function
    - Add `processStackedMonthlyData(data: StackedMonthlyData[])` function (trim trailing zeros)
  - [x] 1.3 Run lint check on modified files
    - Verify no TypeScript errors in colors.ts and processors.ts

**Acceptance Criteria:**
- New color constants exported from `src/lib/charts/colors.ts`
- Stacked monthly data processor functions exported from `src/lib/charts/processors.ts`
- Lint passes on both files

---

### Bar Chart Enhancement

#### Task Group 2: BaseBarChart Stacked Support
**Dependencies:** Task Group 1

- [x] 2.0 Complete BaseBarChart stacked bar support
  - [x] 2.1 Extend `BaseBarChart` props interface
    - Add optional `stackedKeys?: { key: string; color: string; label: string }[]`
    - Add optional `showLegend?: boolean` prop
    - Keep backward compatibility with existing `dataKey` and `color` props
  - [x] 2.2 Update `BaseBarChart` rendering logic
    - Import `Legend` from recharts
    - Conditionally render multiple `<Bar>` components when `stackedKeys` provided
    - Set `stackId="stack"` on all bars for proper stacking
    - Fall back to single bar rendering when `stackedKeys` not provided
  - [x] 2.3 Update `CustomTooltip` for stacked charts
    - Handle multiple payload entries when stacked
    - Display each segment's label and value
    - Show total when stacked
  - [x] 2.4 Run lint check on BaseBarChart.tsx
    - Verify no TypeScript errors
    - Verify backward compatibility with existing usage

**Acceptance Criteria:**
- `BaseBarChart` supports both single bar and stacked bar modes
- Existing `BooksPerMonthChart` and `BookFormatChart` continue to work unchanged
- Stacked tooltip shows all segment values
- Lint passes

---

### Books per Month Enhancement

#### Task Group 3: Books per Month Stacked Bar
**Dependencies:** Task Group 2

- [x] 3.0 Complete Books per Month stacked bar enhancement
  - [x] 3.1 Update API endpoint `src/app/api/charts/books-per-month/route.ts`
    - Modify response structure from `{ month, value }` to `{ month, completed, dnf }`
    - Count COMPLETED books into `completed` field
    - Count DNF books into `dnf` field
    - Update to use `createEmptyStackedMonthlyData` processor
  - [x] 3.2 Update `BooksPerMonthChart` component
    - Pass `stackedKeys` prop to `BaseBarChart`:
      - `{ key: 'completed', color: CHART_COLORS.books, label: 'Completed' }`
      - `{ key: 'dnf', color: CHART_COLORS.dnf, label: 'DNF' }`
    - Enable legend display
    - Update tooltip formatter for stacked data
  - [x] 3.3 Verify chart renders correctly in browser
    - Confirm stacked bars display correctly
    - Confirm tooltip shows both values
    - Confirm legend appears

**Acceptance Criteria:**
- Books per Month chart displays stacked bars (completed + DNF)
- Tooltip shows both segment values
- Legend indicates Completed (blue) and DNF (red)
- API returns correct stacked data structure

---

### New Bar Charts

#### Task Group 4: Pages per Month API and Component
**Dependencies:** Task Group 1

- [x] 4.0 Complete Pages per Month chart
  - [x] 4.1 Create API endpoint `src/app/api/charts/pages-per-month/route.ts`
    - Query UserBooks with COMPLETED or DNF status in year
    - Join to Edition -> GoogleBook for pageCount
    - Filter OUT books where format includes AUDIOBOOK
    - Sum pageCount per month (exclude null pageCount from sum)
    - Return `{ data: [{month, value}], year, total }`
  - [x] 4.2 Create `PagesPerMonthChart` component at `src/components/charts/PagesPerMonthChart.tsx`
    - Follow pattern from `BooksPerMonthChart`
    - Use `CHART_COLORS.pages` (emerald-500)
    - Tooltip: format with thousands separator (e.g., "1,234 pages")
    - Empty state: "No pages recorded this year"
  - [x] 4.3 Run lint check on new files

**Acceptance Criteria:**
- API endpoint returns monthly page sums
- Audiobooks excluded from page count
- Component renders bar chart with emerald color
- Lint passes

---

#### Task Group 5: DNF per Month API and Component
**Dependencies:** Task Group 1

- [x] 5.0 Complete DNF per Month chart
  - [x] 5.1 Create API endpoint `src/app/api/charts/dnf-per-month/route.ts`
    - Query UserBooks with status='DNF' in year
    - Group by finishDate month
    - Use `createEmptyMonthlyData` and `processMonthlyData`
    - Return `{ data: [{month, value}], year, total }`
  - [x] 5.2 Create `DnfPerMonthChart` component at `src/components/charts/DnfPerMonthChart.tsx`
    - Follow pattern from `BooksPerMonthChart`
    - Use `CHART_COLORS.dnf` (red-500)
    - Empty state: "No DNF books this year"
  - [x] 5.3 Run lint check on new files

**Acceptance Criteria:**
- API endpoint returns monthly DNF counts
- Component renders bar chart with red color
- Empty state displays correctly
- Lint passes

---

### New Pie Charts

#### Task Group 6: Main Genres API and Component
**Dependencies:** None

- [x] 6.0 Complete Main Genres chart
  - [x] 6.1 Create API endpoint `src/app/api/charts/main-genres/route.ts`
    - Query UserBooks with COMPLETED or DNF status in year
    - Join UserBook -> Edition -> Book to access `primaryGenre`
    - Filter: only include where `Book.primaryGenre IS NOT NULL`
    - Group by primaryGenre and count
    - Use `aggregatePieData` if >7 unique genres
    - Return `{ data: [{name, value}], year, total }`
  - [x] 6.2 Create `MainGenresChart` component at `src/components/charts/MainGenresChart.tsx`
    - Follow pattern from `BookFormatChart`
    - Use `CHART_COLORS.categorical` colors
    - Empty state: "No genre data available"
  - [x] 6.3 Run lint check on new files

**Acceptance Criteria:**
- API endpoint returns genre distribution
- Only books with primaryGenre included
- Component renders pie chart
- Lint passes

---

#### Task Group 7: Acquisition Method API and Component
**Dependencies:** None

- [x] 7.0 Complete Acquisition Method chart
  - [x] 7.1 Create API endpoint `src/app/api/charts/acquisition-method/route.ts`
    - Query UserBooks with COMPLETED or DNF status in year
    - Filter: only include where `acquisitionMethod IS NOT NULL`
    - Group by acquisitionMethod and count
    - Do NOT aggregate to "Other" - show all unique values
    - Return `{ data: [{name, value}], year, total }`
  - [x] 7.2 Create `AcquisitionMethodChart` component at `src/components/charts/AcquisitionMethodChart.tsx`
    - Follow pattern from `BookFormatChart`
    - Use `CHART_COLORS.categorical` colors
    - Empty state: "No acquisition data available"
  - [x] 7.3 Run lint check on new files

**Acceptance Criteria:**
- API endpoint returns acquisition method distribution
- All unique values shown (no "Other" grouping)
- Component renders pie chart
- Lint passes

---

#### Task Group 8: LGBTQ+ Representation API and Component
**Dependencies:** Task Group 1 (for representation colors)

- [x] 8.0 Complete LGBTQ+ Representation chart
  - [x] 8.1 Create API endpoint `src/app/api/charts/lgbtq-representation/route.ts`
    - Query UserBooks with COMPLETED or DNF status in year
    - Filter: only include where `lgbtqRepresentation IS NOT NULL`
    - Group by lgbtqRepresentation ("Yes", "No", "Unknown") and count
    - Return `{ data: [{name, value}], year, total }`
  - [x] 8.2 Create `LgbtqRepresentationChart` component at `src/components/charts/LgbtqRepresentationChart.tsx`
    - Follow pattern from `BookFormatChart`
    - Use `CHART_COLORS.representation` colors (green/gray/blue)
    - Empty state: "No representation data available"
  - [x] 8.3 Run lint check on new files

**Acceptance Criteria:**
- API endpoint returns LGBTQ+ representation distribution
- Only explicit values included (NULL excluded)
- Component uses representation color scheme
- Lint passes

---

#### Task Group 9: Disability Representation API and Component
**Dependencies:** Task Group 1 (for representation colors)

- [x] 9.0 Complete Disability Representation chart
  - [x] 9.1 Create API endpoint `src/app/api/charts/disability-representation/route.ts`
    - Query UserBooks with COMPLETED or DNF status in year
    - Filter: only include where `disabilityRepresentation IS NOT NULL`
    - Group by disabilityRepresentation ("Yes", "No", "Unknown") and count
    - Return `{ data: [{name, value}], year, total }`
  - [x] 9.2 Create `DisabilityRepresentationChart` component at `src/components/charts/DisabilityRepresentationChart.tsx`
    - Follow pattern from `LgbtqRepresentationChart`
    - Use same `CHART_COLORS.representation` colors
    - Empty state: "No representation data available"
  - [x] 9.3 Run lint check on new files

**Acceptance Criteria:**
- API endpoint returns disability representation distribution
- Only explicit values included (NULL excluded)
- Component uses representation color scheme
- Lint passes

---

#### Task Group 10: POC Authors API and Component
**Dependencies:** Task Group 1 (for representation colors)

- [x] 10.0 Complete POC Authors chart
  - [x] 10.1 Create API endpoint `src/app/api/charts/poc-authors/route.ts`
    - Query UserBooks with COMPLETED or DNF status in year
    - Filter: only include where `authorPoc IS NOT NULL`
    - Group by authorPoc ("Yes", "No", "Unknown") and count
    - Return `{ data: [{name, value}], year, total }`
  - [x] 10.2 Create `PocAuthorsChart` component at `src/components/charts/PocAuthorsChart.tsx`
    - Follow pattern from `LgbtqRepresentationChart`
    - Use same `CHART_COLORS.representation` colors
    - Empty state: "No author diversity data available"
  - [x] 10.3 Run lint check on new files

**Acceptance Criteria:**
- API endpoint returns POC author distribution
- Only explicit values included (NULL excluded)
- Component uses representation color scheme
- Lint passes

---

#### Task Group 11: New Authors API and Component
**Dependencies:** Task Group 1 (for newAuthor colors)

- [x] 11.0 Complete New Authors chart
  - [x] 11.1 Create API endpoint `src/app/api/charts/new-authors/route.ts`
    - Query UserBooks with COMPLETED or DNF status in year
    - Filter: only include where `isNewAuthor IS NOT NULL`
    - Transform boolean to display: true="Yes", false="No"
    - Group and count
    - Return `{ data: [{name, value}], year, total }`
  - [x] 11.2 Create `NewAuthorsChart` component at `src/components/charts/NewAuthorsChart.tsx`
    - Follow pattern from `BookFormatChart`
    - Use `CHART_COLORS.newAuthor` colors (2-color palette)
    - Empty state: "No new author data available"
  - [x] 11.3 Run lint check on new files

**Acceptance Criteria:**
- API endpoint returns new author distribution
- Boolean transformed to Yes/No labels
- Only explicit values included (NULL excluded)
- Component uses 2-color scheme
- Lint passes

---

### Layout Integration

#### Task Group 12: ChartsTab Layout Update
**Dependencies:** Task Groups 3-11

- [x] 12.0 Complete ChartsTab layout integration
  - [x] 12.1 Update `ChartsTab.tsx` imports
    - Import all new chart components:
      - `PagesPerMonthChart`
      - `DnfPerMonthChart`
      - `MainGenresChart`
      - `AcquisitionMethodChart`
      - `LgbtqRepresentationChart`
      - `DisabilityRepresentationChart`
      - `PocAuthorsChart`
      - `NewAuthorsChart`
  - [x] 12.2 Replace placeholder ChartCards with real charts
    - Replace "Pages per Month" placeholder with `<PagesPerMonthChart year={selectedYear} />`
    - Replace "DNF per Month" placeholder with `<DnfPerMonthChart year={selectedYear} />`
    - Change "Reading Type" title to "Acquisition Method" and add `<AcquisitionMethodChart year={selectedYear} />`
    - Replace "Main Genres" placeholder with `<MainGenresChart year={selectedYear} />`
  - [x] 12.3 Add new ChartCards for representation charts
    - Add ChartCard with id="lgbtq-representation" title="LGBTQ+ Representation"
    - Add ChartCard with id="disability-representation" title="Disability Representation"
    - Add ChartCard with id="poc-authors" title="POC Authors"
    - Add ChartCard with id="new-authors" title="New Authors"
  - [x] 12.4 Verify grid layout handles 10 charts
    - Confirm 2-column grid accommodates even number
  - [x] 12.5 Run lint check on ChartsTab.tsx

**Acceptance Criteria:**
- All 10 charts render in ChartsTab
- Placeholder divs removed
- Grid layout displays correctly
- Lint passes

---

### Validation

#### Task Group 13: Final Validation and Testing
**Dependencies:** Task Group 12

- [x] 13.0 Complete final validation
  - [x] 13.1 Run full lint check
    - `npm run lint` passes with no errors
  - [x] 13.2 Run TypeScript type check
    - `npx tsc --noEmit` passes with no errors (in src/)
  - [x] 13.3 Build verification
    - `npm run build` completes successfully
  - [x] 13.4 Manual browser testing
    - Navigate to dashboard Charts tab
    - Verify all 10 charts load
    - Test year selector changes data for all charts
    - Verify empty states display correctly for charts with no data
    - Test tooltip interactions on all chart types
    - Verify stacked bar legend displays correctly

**Acceptance Criteria:**
- Lint passes
- TypeScript compiles without errors
- Build succeeds
- All charts render and respond to year selection
- Empty states work correctly
- Tooltips function on all charts

---

## Execution Order

Recommended implementation sequence:

1. **Shared Infrastructure** (Task Group 1)
   - Must be completed first as other groups depend on colors and processors

2. **BaseBarChart Enhancement** (Task Group 2)
   - Depends on Task Group 1
   - Needed before stacked bar charts can be implemented

3. **Parallel: Bar Charts** (Task Groups 3, 4, 5)
   - Task Group 3 depends on Task Group 2
   - Task Groups 4 and 5 depend on Task Group 1 only
   - These can be done in parallel after dependencies met

4. **Parallel: Pie Charts** (Task Groups 6, 7, 8, 9, 10, 11)
   - Task Groups 6-7 have no dependencies
   - Task Groups 8-11 depend on Task Group 1 for colors
   - All pie charts can be implemented in parallel

5. **Layout Integration** (Task Group 12)
   - Depends on all chart components being complete
   - Must wait for Task Groups 3-11

6. **Final Validation** (Task Group 13)
   - Depends on everything else being complete

### Parallelization Opportunities

**Maximum parallelization after Task Group 2:**
- Task Groups 4, 5, 6, 7, 8, 9, 10, 11 can all proceed in parallel
- Task Group 3 can run in parallel with 4-11 (after Task Group 2)

**Diagram:**
```
[1] → [2] → [3] ─────────────────────────┐
       │                                  │
       └──→ [4] ─────────────────────────┤
       └──→ [5] ─────────────────────────┤
       └──→ [6] ─────────────────────────┤
       └──→ [7] ─────────────────────────┼──→ [12] → [13]
       └──→ [8] ─────────────────────────┤
       └──→ [9] ─────────────────────────┤
       └──→ [10] ────────────────────────┤
       └──→ [11] ────────────────────────┘
```

---

## File Summary

### New Files Created
- `src/app/api/charts/pages-per-month/route.ts`
- `src/app/api/charts/dnf-per-month/route.ts`
- `src/app/api/charts/main-genres/route.ts`
- `src/app/api/charts/acquisition-method/route.ts`
- `src/app/api/charts/lgbtq-representation/route.ts`
- `src/app/api/charts/disability-representation/route.ts`
- `src/app/api/charts/poc-authors/route.ts`
- `src/app/api/charts/new-authors/route.ts`
- `src/components/charts/PagesPerMonthChart.tsx`
- `src/components/charts/DnfPerMonthChart.tsx`
- `src/components/charts/MainGenresChart.tsx`
- `src/components/charts/AcquisitionMethodChart.tsx`
- `src/components/charts/LgbtqRepresentationChart.tsx`
- `src/components/charts/DisabilityRepresentationChart.tsx`
- `src/components/charts/PocAuthorsChart.tsx`
- `src/components/charts/NewAuthorsChart.tsx`

### Existing Files Modified
- `src/lib/charts/colors.ts` - Add representation and newAuthor colors
- `src/lib/charts/processors.ts` - Add stacked monthly data processor
- `src/components/charts/BaseBarChart.tsx` - Add stacked bar support
- `src/app/api/charts/books-per-month/route.ts` - Return stacked data structure
- `src/components/charts/BooksPerMonthChart.tsx` - Use stacked bar rendering
- `src/components/charts/ChartsTab.tsx` - Integrate all new charts
