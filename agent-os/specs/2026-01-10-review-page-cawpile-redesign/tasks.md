# Task Breakdown: Review Page CAWPILE Redesign

## Overview
Total Tasks: 15

This spec redesigns the CAWPILE rating display on the public review page (`/share/reviews/[shareToken]`) to show each facet as a vertically stacked box with letter, word, rating, and description in a specific horizontal layout.

## Task List

### Setup & Analysis

#### Task Group 1: Project Setup and Reference Analysis
**Dependencies:** None

- [x] 1.0 Complete setup and reference analysis
  - [x] 1.1 Verify existing type definitions in `src/types/cawpile.ts`
    - Confirm `getFacetConfig()` returns correct facet arrays for FICTION and NONFICTION
    - Verify `CawpileFacet` interface has `name`, `key`, `description` fields
    - Document how to extract first letter from facet `name` property
  - [x] 1.2 Analyze existing `CawpileFacetDisplay.tsx` patterns (reference only)
    - Review iteration pattern over facets at `/Users/cwalker/Projects/cawpile/review-redesign/src/components/rating/CawpileFacetDisplay.tsx`
    - Note how rating values are accessed via `rating[facet.key]`
    - Document null/undefined handling approach
  - [x] 1.3 Review design tokens in `src/app/globals.css`
    - Confirm availability of `bg-muted`, `text-muted-foreground`, `text-card-foreground`
    - Note `border-border` for box borders
    - Verify TailwindCSS 4 utility class compatibility

**Acceptance Criteria:**
- Type definitions documented and understood
- Reference patterns documented for reuse
- Design tokens confirmed available

---

### Component Creation

#### Task Group 2: PublicCawpileFacetDisplay Component
**Dependencies:** Task Group 1

- [x] 2.0 Complete PublicCawpileFacetDisplay component
  - [x] 2.1 Create component file structure
    - Create `/Users/cwalker/Projects/cawpile/review-redesign/src/components/share/PublicCawpileFacetDisplay.tsx`
    - Add `'use client'` directive
    - Import `BookType`, `CawpileRating`, `getFacetConfig` from `@/types/cawpile`
  - [x] 2.2 Define component interface
    - Props: `rating: Partial<CawpileRating> | null`, `bookType: BookType`
    - Optional `className?: string` for additional styling
    - Match prop types with existing `CawpileFacetDisplay.tsx` for consistency
  - [x] 2.3 Implement facet box sub-component
    - Large letter at top using `text-3xl font-bold`
    - Full word below letter using `text-sm`
    - Vertical stack with `flex flex-col items-center`
    - Neutral background using `bg-muted`
    - Border using `border border-border`
    - Padding for contained visual unit
  - [x] 2.4 Implement rating number display
    - Large rating value using `text-2xl font-bold`
    - "/10" suffix in `text-sm text-muted-foreground`
    - Positioned to right of box with small gap
    - Neutral styling (no color-coding)
    - Handle null/undefined values with "--" fallback
  - [x] 2.5 Implement description text
    - Use `description` field from facet config
    - Style with `text-muted-foreground`
    - Position to right of rating number
    - Responsive: `hidden sm:block` (hides below 640px)
  - [x] 2.6 Implement vertical stacking layout
    - All 7 facets stack vertically using `space-y-4`
    - Each facet row: `flex items-center gap-4`
    - Order follows CAWPILE acronym from `getFacetConfig()`
  - [x] 2.7 Handle edge cases
    - Return null if `rating` is null
    - Support both FICTION and NONFICTION book types
    - Extract first letter from facet name: `facet.name.charAt(0).toUpperCase()`
    - Handle "/" in nonfiction names (e.g., "Credibility/Research" -> "C")

**Acceptance Criteria:**
- Component renders all 7 facets in vertical stack
- Box displays letter + word correctly
- Rating displays with "/10" suffix
- Description shows/hides based on viewport width
- Both FICTION and NONFICTION facets render correctly

---

### Integration

#### Task Group 3: PublicReviewDisplay Integration
**Dependencies:** Task Group 2

- [x] 3.0 Complete integration with PublicReviewDisplay
  - [x] 3.1 Update imports in `PublicReviewDisplay.tsx`
    - File: `/Users/cwalker/Projects/cawpile/review-redesign/src/components/share/PublicReviewDisplay.tsx`
    - Replace import of `CawpileFacetDisplay` from `@/components/rating/CawpileFacetDisplay`
    - Add import for `PublicCawpileFacetDisplay` from `@/components/share/PublicCawpileFacetDisplay`
  - [x] 3.2 Replace component usage (lines 122-126)
    - Replace `<CawpileFacetDisplay rating={cawpileRating} bookType={bookType} compact={false} />`
    - With `<PublicCawpileFacetDisplay rating={cawpileRating} bookType={bookType} />`
    - Remove `compact` prop (new component does not use it)
  - [x] 3.3 Preserve surrounding structure
    - Keep section heading "CAWPILE Rating" (line 119-121)
    - Keep wrapper div with padding classes (line 118)
    - Ensure no changes to other sections of PublicReviewDisplay

**Acceptance Criteria:**
- PublicReviewDisplay uses new PublicCawpileFacetDisplay component
- Old CawpileFacetDisplay import removed
- Surrounding HTML structure unchanged
- Page renders without errors

---

### Verification

#### Task Group 4: Manual Testing and Verification
**Dependencies:** Task Group 3

- [x] 4.0 Complete manual testing and verification
  - [x] 4.1 Verify FICTION book type rendering
    - All 7 facets display: Characters, Atmosphere, Writing, Plot, Intrigue, Logic, Enjoyment
    - Letters display: C, A, W, P, I, L, E
    - Descriptions match facet config
  - [x] 4.2 Verify NONFICTION book type rendering
    - All 7 facets display with nonfiction names
    - First letters extract correctly (e.g., "C" from "Credibility/Research")
    - Descriptions match nonfiction facet config
  - [x] 4.3 Verify responsive behavior
    - Desktop (>640px): Box, rating, and description all visible
    - Mobile (<640px): Box and rating visible, description hidden
    - No layout breaks at any viewport width
  - [x] 4.4 Verify visual design matches spec
    - Neutral background on boxes (no color-coding)
    - Proper typography hierarchy (letter > word > rating > description)
    - Consistent vertical spacing between facet rows
    - Box has visible border
  - [x] 4.5 Verify integration isolation
    - Changes only affect `/share/reviews/[shareToken]` route
    - Existing `CawpileFacetDisplay.tsx` unchanged
    - Dashboard and modal CAWPILE displays unaffected
  - [x] 4.6 Run linting and type checks
    - Execute `npm run lint`
    - Execute `npm run build` to verify TypeScript compilation
    - Fix any errors before marking complete

**Acceptance Criteria:**
- Both FICTION and NONFICTION render correctly
- Responsive behavior works as specified
- Visual design matches spec requirements
- No lint or type errors
- Build completes successfully

---

## Execution Order

Recommended implementation sequence:
1. **Setup & Analysis** (Task Group 1) - Understand existing code and patterns
2. **Component Creation** (Task Group 2) - Build the new PublicCawpileFacetDisplay
3. **Integration** (Task Group 3) - Connect new component to PublicReviewDisplay
4. **Verification** (Task Group 4) - Test and validate all requirements

## Key File Paths

| File | Purpose |
|------|---------|
| `/Users/cwalker/Projects/cawpile/review-redesign/src/components/share/PublicCawpileFacetDisplay.tsx` | NEW - Component to create |
| `/Users/cwalker/Projects/cawpile/review-redesign/src/components/share/PublicReviewDisplay.tsx` | Integration point (lines 122-126) |
| `/Users/cwalker/Projects/cawpile/review-redesign/src/types/cawpile.ts` | Type definitions and getFacetConfig() |
| `/Users/cwalker/Projects/cawpile/review-redesign/src/components/rating/CawpileFacetDisplay.tsx` | Reference only - DO NOT MODIFY |
| `/Users/cwalker/Projects/cawpile/review-redesign/src/app/globals.css` | Design tokens |

## Notes

- **No test framework**: This project does not have a testing framework configured. Verification relies on manual testing and linting.
- **Component isolation**: The new component is specific to the public share page. Do not modify existing `CawpileFacetDisplay.tsx`.
- **Responsive breakpoint**: TailwindCSS `sm:` prefix targets 640px and above. Use `hidden sm:block` for description visibility.
