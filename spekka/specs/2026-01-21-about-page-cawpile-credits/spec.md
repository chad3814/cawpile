# Specification: About Page & CAWPILE Credits

## Goal
Create an About page that credits Book Roast as the creator of the CAWPILE rating system and enhance the homepage with a comprehensive CAWPILE explanation section featuring interactive example charts.

## User Stories
- As a visitor, I want to learn about the CAWPILE rating system so that I understand how it works before signing up
- As a user, I want to credit the creator of CAWPILE so that I can explore the original content and support the creator

## Specific Requirements

**About Page Route**
- Create new page at `/about` route using Next.js App Router
- Page must be publicly accessible (no authentication required)
- Use Server Component pattern consistent with existing pages
- Apply same layout wrapper and styling as homepage

**Book Roast Credit Section**
- Display YouTube channel name "Book Roast" as a clickable link to https://www.youtube.com/@BookRoast
- Include brief text explaining that CAWPILE was created by Book Roast
- Show CAWPILE acronym breakdown: Characters, Atmosphere, Writing, Plot, Intrigue, Logic, Enjoyment
- Add link to CAWPILE playlist: https://www.youtube.com/playlist?list=PL3V6H7y0QuPPNa_DRxClpQ5XU1E-vZpJA
- Links should open in new tab with appropriate `rel="noopener noreferrer"` attributes

**Footer Component**
- Create new Footer component in `src/components/layout/Footer.tsx`
- Add link to About page (`/about`)
- Footer should be visible on all pages (add to root layout)
- Style consistently with Header component using same color tokens and spacing

**Homepage CAWPILE Section**
- Replace/augment existing "Track Your Reading Journey" hero section
- Position CAWPILE explanation above the existing features grid
- Display all 7 CAWPILE facets with their descriptions from `FICTION_FACETS` and `NONFICTION_FACETS`
- Show both Fiction and Non-Fiction variations with clear visual separation (tabs or toggle)
- Include rating scale guide (1-10 with meanings) from `RATING_SCALE_GUIDE` constant

**Homepage Example Charts**
- Add section with three smaller interactive charts below CAWPILE explanation
- Use `BaseBarChart` for Books per Month chart with stacked completed/DNF data
- Use `BasePieChart` for Book Format chart with format distribution
- Use `BaseBarChart` for Pages per Month chart with monthly page counts
- Charts should use demo data (hardcoded static data, not API calls)
- Maintain interactive tooltips on hover using existing Recharts tooltip patterns
- Charts should be responsive and smaller than dashboard versions

**Demo Data Structure**
- Create demo data in a dedicated file `src/lib/charts/demoData.ts`
- Books per month: 12 months with varied completed/DNF counts (sample values like 3-8 books/month)
- Book format: Distribution across Physical, Ebook, Audiobook, Graphic Novel
- Pages per month: 12 months with varied page counts (sample values like 500-2000 pages/month)

## Visual Design
No visual mockups provided. Follow existing design patterns from the homepage and charts.

## Existing Code to Leverage

**CAWPILE Type Definitions (`src/types/cawpile.ts`)**
- Contains `FICTION_FACETS` and `NONFICTION_FACETS` arrays with facet names, descriptions, and questions
- Contains `RATING_SCALE_GUIDE` array with 1-10 scale labels
- Reuse these constants directly for displaying facet information and rating scale

**Base Chart Components (`src/components/charts/`)**
- `BaseBarChart.tsx` supports stacked bars via `stackedKeys` prop and single bars via `dataKey` prop
- `BasePieChart.tsx` supports pie/donut charts with customizable colors via `colors` prop
- Both components include `ResponsiveContainer` and `Tooltip` with custom formatters
- Wrap charts with reduced height (e.g., 200px) for homepage display

**Chart Configuration (`src/lib/charts/`)**
- `CHART_COLORS` provides consistent color palette for books, pages, dnf, and format types
- `CHART_CONFIG` provides margin, animation, and styling settings
- `formatters.ts` provides `formatBookCount` and `formatPageCount` for tooltips

**Header Component (`src/components/layout/Header.tsx`)**
- Follow same styling patterns for Footer component
- Uses Tailwind classes like `bg-background`, `border-border`, `text-foreground`
- Uses `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8` for consistent container width

**Root Layout (`src/app/layout.tsx`)**
- Footer component should be added after `<main>` element within `SessionProvider`
- Maintains same structure as Header placement

## Out of Scope
- Real user data on homepage charts (must use demo data only)
- Additional chart types beyond the three specified (Books per Month, Book Format, Pages per Month)
- Contact forms or feedback mechanisms on the About page
- Social media links beyond the two specified YouTube links
- User preferences or customization for About page content
- Navigation changes to Header component (footer link only)
- Dark mode specific styling for YouTube links (rely on existing link styles)
- Animation or transitions for facet tab switching
- Mobile-specific About page layout variations
