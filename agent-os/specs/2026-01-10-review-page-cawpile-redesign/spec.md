# Specification: Review Page CAWPILE Redesign

## Goal
Redesign the CAWPILE rating display on the public review page (`/share/reviews/[shareToken]`) to show each facet as a vertically stacked box with letter, word, rating, and description in a specific horizontal layout.

## User Stories
- As a public viewer, I want to see CAWPILE ratings displayed clearly with the letter acronym prominent so that I can quickly understand each facet's meaning and score.
- As a reviewer sharing my rating, I want the CAWPILE display to look professional and scannable so that recipients can easily digest my rating breakdown.

## Specific Requirements

**Facet Box Layout**
- Each facet displays as a horizontal row: [Box] [Rating] [Description]
- Box contains large single letter (C, A, W, P, I, L, E) at top
- Full facet word (e.g., "Characters") appears below the letter, inside the same box
- Letter and word are vertically stacked within the box, centered horizontally
- Box has neutral background color (use `bg-muted` from design system)

**Rating Number Display**
- Rating value (1-10) appears immediately to the right of the box
- Use large, prominent typography for the rating number
- Include "/10" suffix in smaller, muted text
- Rating number should NOT be color-coded (neutral styling only)

**Description Text**
- Description text appears to the right of the rating number
- Use the existing `description` field from `CawpileFacet` type
- Text should be muted/secondary color for visual hierarchy
- Description provides context (e.g., "Character development and memorability")

**Vertical Stacking**
- All 7 CAWPILE facets stack vertically (no horizontal grid)
- Consistent vertical spacing between facet rows (use `space-y-4` pattern)
- Order follows the CAWPILE acronym sequence from `getFacetConfig()`

**Responsive Behavior**
- Description text hides on narrow viewports (below `sm` breakpoint, 640px)
- Box and rating number always remain visible at all screen sizes
- Use TailwindCSS `hidden sm:block` pattern for description visibility
- No layout changes to row structure on narrow screens (no accordion/collapse)

**Component Isolation**
- Changes apply ONLY to the public share page at `/share/reviews/[shareToken]`
- Create a new component `PublicCawpileFacetDisplay.tsx` in `src/components/share/`
- Do NOT modify the existing `CawpileFacetDisplay.tsx` used elsewhere
- Do NOT affect rating modals, dashboard displays, or compact mode

**Integration Point**
- Replace the `CawpileFacetDisplay` usage in `PublicReviewDisplay.tsx` with the new component
- Pass the same props: `rating`, `bookType`
- Preserve support for both FICTION and NONFICTION facet configurations

## Visual Design

**`planning/visuals/` (ASCII Mockup from Requirements)**
- Large single letter centered at top of box (use `text-3xl font-bold`)
- Full facet word below letter in smaller text (use `text-sm`)
- Box has border and padding to create contained visual unit
- Rating number uses prominent size (use `text-2xl font-bold`)
- Description uses muted color and normal weight
- Horizontal alignment: box flush left, rating with small gap, description fills remaining space

## Existing Code to Leverage

**`src/types/cawpile.ts` - Facet Configuration**
- Use `getFacetConfig(bookType)` to get facet array for FICTION vs NONFICTION
- Each facet has `name` (full word), `key` (rating field), `description` (context text)
- Extract first letter from `name` for the large letter display
- Handles both book types with different facet names (e.g., "Characters" vs "Credibility/Research")

**`src/components/share/PublicReviewDisplay.tsx` - Integration Point**
- Currently imports and uses `CawpileFacetDisplay` at line 122-126
- Receives `cawpileRating` and `bookType` from props
- Replace this single usage with the new `PublicCawpileFacetDisplay` component
- Preserve the section heading "CAWPILE Rating" and surrounding structure

**`src/app/globals.css` - Design System Variables**
- Use `bg-muted` for neutral box background color
- Use `text-muted-foreground` for description text
- Use `text-card-foreground` for primary text (letter, word, rating)
- Leverage existing `border-border` for box borders

**`src/components/rating/CawpileFacetDisplay.tsx` - Reference Pattern**
- Shows iteration pattern over facets using `getFacetConfig(bookType)`
- Demonstrates accessing rating values via `rating[facet.key]`
- Shows null/undefined handling for rating values
- Do NOT modify this file; use as reference only

**Responsive Breakpoints**
- TailwindCSS `sm:` prefix targets 640px and above
- Use `hidden sm:inline` or `hidden sm:block` for description
- Consistent with existing responsive patterns in the codebase

## Out of Scope
- Modifications to `CawpileFacetDisplay.tsx` (existing component used elsewhere)
- Changes to CAWPILE rating modal or input forms
- Dashboard CAWPILE display changes
- Compact mode display changes
- Star rating or letter grade modifications
- Color-coding boxes or ratings based on score value
- Interactive hover states or animations
- Accordion or collapsible behavior on mobile
- Changes to the overall page layout or other sections of PublicReviewDisplay
- Adding new data fields or API changes
