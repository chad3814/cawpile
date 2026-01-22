# Task Breakdown: About Page & CAWPILE Credits

## Overview
Total Tasks: 22

This feature introduces an About page crediting Book Roast as the CAWPILE creator, a global Footer component, and enhances the homepage with a comprehensive CAWPILE explanation section featuring interactive demo charts.

## Task List

### Foundation Layer

#### Task Group 1: Demo Data & Utilities
**Dependencies:** None

- [x] 1.0 Complete demo data foundation
  - [x] 1.1 Write 2-4 focused tests for demo data utilities
    - Test demo data structure validity (correct keys, value ranges)
    - Test data arrays have expected length (12 months)
    - Test format distribution sums to reasonable total
  - [x] 1.2 Create demo data file `src/lib/charts/demoData.ts`
    - Export `DEMO_BOOKS_PER_MONTH` - 12 months with `month`, `completed` (3-8), `dnf` (0-2) keys
    - Export `DEMO_PAGES_PER_MONTH` - 12 months with `month`, `pages` (500-2000) keys
    - Export `DEMO_BOOK_FORMAT` - Array with `name` (Physical, Ebook, Audiobook, Graphic Novel) and `value` counts
    - Use realistic month labels (Jan, Feb, Mar, etc.)
  - [x] 1.3 Update chart library exports `src/lib/charts/index.ts`
    - Add export for demo data: `export * from './demoData'`
  - [x] 1.4 Ensure demo data tests pass
    - Run ONLY the 2-4 tests written in 1.1
    - Verify data structure matches chart component expectations

**Acceptance Criteria:**
- Demo data exports are type-safe and match existing chart data patterns
- Data values are realistic and representative of typical reading habits
- Tests verify data structure integrity

---

### UI Components Layer

#### Task Group 2: Footer Component
**Dependencies:** Task Group 1

- [x] 2.0 Complete Footer component
  - [x] 2.1 Write 2-4 focused tests for Footer component
    - Test Footer renders About link with correct href
    - Test link has proper styling classes
    - Test component renders without errors
  - [x] 2.2 Create Footer component `src/components/layout/Footer.tsx`
    - Mark as Server Component (no `"use client"` directive)
    - Add link to `/about` page
    - Use same container width as Header: `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`
    - Style with consistent tokens: `bg-background`, `border-border`, `text-foreground`
    - Add border-top similar to Header's border-bottom
  - [x] 2.3 Integrate Footer into root layout `src/app/layout.tsx`
    - Import Footer component
    - Add Footer after `<main>` element, inside `SessionProvider`
    - Adjust main element styling if needed for footer spacing
  - [x] 2.4 Ensure Footer tests pass
    - Run ONLY the 2-4 tests written in 2.1
    - Verify Footer renders correctly in layout

**Acceptance Criteria:**
- Footer is visible on all pages
- About link navigates correctly to `/about`
- Styling is consistent with Header component

---

#### Task Group 3: CAWPILE Facets Display Component
**Dependencies:** Task Group 1

- [x] 3.0 Complete CAWPILE facets display component
  - [x] 3.1 Write 2-4 focused tests for CawpileFacetsDisplay component
    - Test Fiction facets render all 7 facet names
    - Test Non-Fiction facets render when toggled
    - Test rating scale guide displays all 10 values
  - [x] 3.2 Create CawpileFacetsDisplay component `src/components/homepage/CawpileFacetsDisplay.tsx`
    - Mark as Client Component (`"use client"`) for tab/toggle interactivity
    - Import `FICTION_FACETS`, `NONFICTION_FACETS`, `RATING_SCALE_GUIDE` from `@/types/cawpile`
    - Implement Fiction/Non-Fiction toggle or tabs with clear visual separation
    - Display facet name, description for each of the 7 facets
    - Display rating scale guide (1-10 with labels) below facets
    - Style with existing design tokens and Tailwind classes
  - [x] 3.3 Ensure CawpileFacetsDisplay tests pass
    - Run ONLY the 2-4 tests written in 3.1
    - Verify both facet sets display correctly

**Acceptance Criteria:**
- All 7 CAWPILE facets display for both Fiction and Non-Fiction
- Toggle/tabs switch between facet sets without page reload
- Rating scale guide shows all 10 levels with descriptions

---

#### Task Group 4: Homepage Demo Charts Section
**Dependencies:** Task Groups 1, 3

- [x] 4.0 Complete homepage demo charts section
  - [x] 4.1 Write 2-4 focused tests for HomepageCharts component
    - Test component renders three chart containers
    - Test charts use demo data (verify data is not fetched from API)
    - Test responsive container classes are applied
  - [x] 4.2 Create HomepageCharts component `src/components/homepage/HomepageCharts.tsx`
    - Mark as Client Component (`"use client"`) for Recharts interactivity
    - Import `BaseBarChart`, `BasePieChart` from `@/components/charts`
    - Import demo data from `@/lib/charts`
    - Import `CHART_COLORS` for consistent colors
    - Import formatters: `formatBookCount`, `formatPageCount` from `@/lib/charts/formatters`
    - Implement Books per Month chart using `BaseBarChart` with stacked `completed`/`dnf` keys
    - Implement Book Format chart using `BasePieChart` with format distribution
    - Implement Pages per Month chart using `BaseBarChart` with `pages` dataKey
    - Set chart container height to 200px (smaller than dashboard versions)
    - Add chart titles/labels for each chart
    - Ensure responsive layout (grid that stacks on mobile)
  - [x] 4.3 Ensure HomepageCharts tests pass
    - Run ONLY the 2-4 tests written in 4.1
    - Verify charts render with demo data

**Acceptance Criteria:**
- Three interactive charts display with demo data
- Tooltips work on hover showing formatted values
- Charts are responsive and smaller than dashboard versions
- No API calls are made for chart data

---

### Page Layer

#### Task Group 5: About Page
**Dependencies:** Task Groups 2, 3

- [x] 5.0 Complete About page
  - [x] 5.1 Write 2-4 focused tests for About page
    - Test page renders Book Roast credit text
    - Test YouTube channel link has correct href and target="_blank"
    - Test CAWPILE playlist link has correct href and rel attributes
  - [x] 5.2 Create About page `src/app/about/page.tsx`
    - Use Server Component pattern (no `"use client"` directive)
    - Add page metadata (title, description)
    - Create Book Roast credit section with:
      - YouTube channel link: `https://www.youtube.com/@BookRoast` (opens in new tab)
      - Brief explanation that CAWPILE was created by Book Roast
      - CAWPILE acronym breakdown (Characters, Atmosphere, Writing, Plot, Intrigue, Logic, Enjoyment)
      - Playlist link: `https://www.youtube.com/playlist?list=PL3V6H7y0QuPPNa_DRxClpQ5XU1E-vZpJA` (opens in new tab)
    - External links must have `target="_blank"` and `rel="noopener noreferrer"`
    - Apply same layout wrapper and styling patterns as homepage
    - Use container: `max-w-4xl mx-auto px-6 py-16`
  - [x] 5.3 Ensure About page tests pass
    - Run ONLY the 2-4 tests written in 5.1
    - Verify page is accessible without authentication

**Acceptance Criteria:**
- About page is publicly accessible at `/about`
- Book Roast credited with working YouTube links
- CAWPILE acronym clearly explained
- Links open in new tabs with security attributes

---

#### Task Group 6: Homepage Enhancement
**Dependencies:** Task Groups 3, 4

- [x] 6.0 Complete homepage enhancement
  - [x] 6.1 Write 2-4 focused tests for enhanced homepage
    - Test CAWPILE explanation section renders
    - Test demo charts section renders below CAWPILE explanation
    - Test existing features grid still renders
  - [x] 6.2 Update homepage `src/app/page.tsx`
    - Import `CawpileFacetsDisplay` component
    - Import `HomepageCharts` component
    - Add CAWPILE explanation section after hero, before features grid:
      - Section heading introducing the CAWPILE rating system
      - Embed `CawpileFacetsDisplay` component
    - Add demo charts section below CAWPILE explanation:
      - Section heading for reading statistics preview
      - Embed `HomepageCharts` component
    - Maintain existing hero section and features grid
    - Ensure proper spacing between sections
  - [x] 6.3 Ensure homepage enhancement tests pass
    - Run ONLY the 2-4 tests written in 6.1
    - Verify all sections render in correct order

**Acceptance Criteria:**
- Homepage displays CAWPILE explanation with facets toggle
- Demo charts section shows interactive example charts
- Existing hero and features sections remain intact
- Page maintains responsive design

---

### Testing & Validation

#### Task Group 7: Integration Testing & Final Validation
**Dependencies:** Task Groups 1-6

- [x] 7.0 Review and validate implementation
  - [x] 7.1 Review tests from Task Groups 1-6
    - Review the 2-4 tests from demo data (Task 1.1)
    - Review the 2-4 tests from Footer component (Task 2.1)
    - Review the 2-4 tests from CawpileFacetsDisplay (Task 3.1)
    - Review the 2-4 tests from HomepageCharts (Task 4.1)
    - Review the 2-4 tests from About page (Task 5.1)
    - Review the 2-4 tests from homepage enhancement (Task 6.1)
    - Total existing tests: approximately 12-24 tests
  - [x] 7.2 Identify critical integration gaps
    - Focus on user flow: homepage -> About page navigation
    - Verify Footer appears on both pages
    - Check chart interactivity works on homepage
  - [x] 7.3 Write up to 6 additional integration tests if needed
    - Test Footer link navigation to About page works
    - Test demo charts display correctly on homepage load
    - Test facet toggle maintains state during interaction
    - Test external links on About page have correct attributes
    - Skip edge cases and visual regression tests
  - [x] 7.4 Run all feature-specific tests
    - Run tests from `__tests__/components/homepage/`
    - Run tests from `__tests__/components/layout/Footer`
    - Run tests from `__tests__/app/about/`
    - Run tests from `__tests__/lib/charts/demoData`
    - Expected total: approximately 18-30 tests
    - Verify all tests pass
  - [x] 7.5 Manual verification checklist
    - [x] About page loads at `/about` without authentication
    - [x] Book Roast YouTube link works and opens in new tab
    - [x] CAWPILE playlist link works and opens in new tab
    - [x] Footer visible on homepage, About page, and dashboard
    - [x] Homepage CAWPILE section shows Fiction facets by default
    - [x] Toggle switches to Non-Fiction facets correctly
    - [x] Rating scale displays 1-10 with labels
    - [x] Demo charts render with tooltips on hover
    - [x] Charts are responsive on mobile viewport

**Acceptance Criteria:**
- All feature-specific tests pass (approximately 18-30 tests total)
- Manual verification checklist completed
- No console errors on any page
- Links work correctly with proper security attributes

---

## Execution Order

Recommended implementation sequence:
1. **Foundation** - Task Group 1 (Demo Data & Utilities)
2. **Layout** - Task Group 2 (Footer Component)
3. **UI Components** - Task Group 3 (CAWPILE Facets Display)
4. **UI Components** - Task Group 4 (Homepage Demo Charts)
5. **Pages** - Task Group 5 (About Page)
6. **Pages** - Task Group 6 (Homepage Enhancement)
7. **Validation** - Task Group 7 (Integration Testing)

## File Summary

### New Files
| File Path | Description |
|-----------|-------------|
| `src/lib/charts/demoData.ts` | Static demo data for homepage charts |
| `src/components/layout/Footer.tsx` | Global footer with About link |
| `src/components/homepage/CawpileFacetsDisplay.tsx` | CAWPILE facets toggle component |
| `src/components/homepage/HomepageCharts.tsx` | Demo charts section component |
| `src/app/about/page.tsx` | About page with Book Roast credits |
| `__tests__/lib/charts/demoData.test.ts` | Demo data tests |
| `__tests__/components/layout/Footer.test.tsx` | Footer component tests |
| `__tests__/components/homepage/CawpileFacetsDisplay.test.tsx` | Facets display tests |
| `__tests__/components/homepage/HomepageCharts.test.tsx` | Demo charts tests |
| `__tests__/app/about/page.test.tsx` | About page tests |

### Modified Files
| File Path | Changes |
|-----------|---------|
| `src/lib/charts/index.ts` | Add demoData export |
| `src/app/layout.tsx` | Add Footer component |
| `src/app/page.tsx` | Add CAWPILE explanation and demo charts sections |

## Dependencies Reference

### Existing Code to Leverage
- `src/types/cawpile.ts` - FICTION_FACETS, NONFICTION_FACETS, RATING_SCALE_GUIDE constants
- `src/components/charts/BaseBarChart.tsx` - Reusable bar chart with stacked bar support
- `src/components/charts/BasePieChart.tsx` - Reusable pie/donut chart
- `src/lib/charts/colors.ts` - CHART_COLORS constant
- `src/lib/charts/formatters.ts` - formatBookCount, formatPageCount functions
- `src/components/layout/Header.tsx` - Styling patterns for Footer

### External Links
- Book Roast YouTube Channel: https://www.youtube.com/@BookRoast
- CAWPILE Playlist: https://www.youtube.com/playlist?list=PL3V6H7y0QuPPNa_DRxClpQ5XU1E-vZpJA
