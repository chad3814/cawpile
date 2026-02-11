# Specification: Fix Star Rating Display in Docker

## Goal
Replace the emoji star character with Unicode BLACK STAR to ensure star ratings render correctly in the Docker container environment, which lacks emoji font support.

## User Stories
- As a user generating recap videos, I want to see star ratings displayed correctly so that my book ratings are visually represented in the final video
- As a developer, I want the rendering to work consistently across local development and Docker environments so that what I preview matches production output

## Specific Requirements

**Replace emoji star with Unicode BLACK STAR**
- Change filled star from `'⭐'` (U+2B50 emoji) to `'\u2605'` (BLACK STAR Unicode character)
- Keep empty star as `'\u2606'` (WHITE STAR Unicode character) - already in use
- Both characters are standard Unicode symbols with broad font support
- No Docker image changes required

**Add explicit color styling for stars**
- Apply gold/yellow color (`#FFD700`) to filled stars for visual distinction
- Apply muted color (`COLORS.textMuted`) to empty stars
- Use the existing inline style pattern already in the component
- Color styling ensures filled/empty stars are visually distinguishable without emoji

**Maintain existing animation behavior**
- Preserve the "slam down" spring animation for each star
- Keep staggered appearance timing (`starDelay` of 4 frames between stars)
- Retain transform, opacity, and scale interpolations
- No changes to animation timing or physics

**Ensure cross-environment consistency**
- Fix must work in both Docker production and local Remotion Studio
- Stars should render at consistent size (current 40px font-size)
- Visual appearance should be acceptable in both environments

## Visual Design
No visual mockups provided.

## Existing Code to Leverage

**BookReveal.tsx star rendering (lines 235-261)**
- Contains the star rendering loop with spring animations
- Already uses `'\u2606'` for empty stars, only filled star needs change
- Has inline style object ready for color property addition
- Animation logic should remain unchanged

**theme.ts color system**
- `COLORS.textMuted` available for empty star styling
- `getRatingColor()` function shows color styling pattern used elsewhere
- Gold color `#FFD700` aligns with common star rating conventions

**theme.ts convertToStars function**
- Converts numeric rating (0-10) to star count (0-5)
- Logic is correct and unaffected by this change
- Called at line 85 in BookReveal.tsx

## Out of Scope
- Installing emoji fonts in Docker image
- Creating SVG-based star components
- Redesigning the star rating visual style beyond color
- Changing the rating calculation logic in `convertToStars()`
- Modifying star animation timing or physics
- Adding new font dependencies to the Docker image
- Changing star sizes or spacing
- Supporting other emoji characters in the application
- Modifying the Dockerfile for font installation
- Changing the 5-star rating system structure
