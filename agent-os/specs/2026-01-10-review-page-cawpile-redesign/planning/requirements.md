# Spec Requirements: Review Page CAWPILE Redesign

## Initial Description

Redesign the CAWPILE rating display on the public review page (`/share/reviews/[shareToken]`) to show each facet as a vertically stacked box with the letter, full word inside the box, rating number, and description arranged in a specific layout.

## Requirements Discussion

### First Round Questions

**Q1:** I assume the layout should show each CAWPILE facet as a vertical stack of boxes (one on top of another, not horizontal). Inside each box: large letter at top, full word below it. To the right of the box: the rating number, then the description. Is that correct?
**Answer:** Yes, that is correct. Each CAWPILE facet displayed as a vertical stack of boxes with large letter at top, full word INSIDE the box below the letter, rating number to the RIGHT of the box, and description to the RIGHT of the rating number.

**Q2:** Should the boxes be color-coded based on the rating score (e.g., green for high, red for low), or use a consistent neutral style regardless of rating?
**Answer:** Consistent neutral background - NOT color-coded by score.

**Q3:** For responsive design on smaller screens, should the facets remain vertically stacked, or switch to a more compact layout (e.g., horizontal row, accordion)?
**Answer:** Always vertically stacked - no responsive row changes. Description hides when window is too narrow, but rating and box always visible.

**Q4:** Should this redesign apply only to the public share page (`/share/reviews/[shareToken]`), or also update CAWPILE displays in other places like the rating modal or dashboard?
**Answer:** Only applies to the public review page at `/share/reviews/[shareToken]` - NOT modals or other displays.

**Q5:** Should the overall star rating and letter grade still appear alongside the CAWPILE breakdown, or should the new design replace/relocate those elements?
**Answer:** No changes to star ratings or other components - everything else stays as-is. Only the CAWPILE facet display is being redesigned.

### Existing Code to Reference

No similar existing features identified for reference. The current CAWPILE display exists but is being redesigned with a new layout pattern.

### Follow-up Questions

No follow-up questions were needed.

## Visual Assets

### Files Provided:
No visual assets provided.

### Visual Insights:
User provided an ASCII mockup of the intended layout:

```
+-------------------+
|       C           |   8   Character development and memorability
|   Characters      |
+-------------------+

+-------------------+
|       A           |   7   Setting and mood
|   Atmosphere      |
+-------------------+
... (and so on for W, P, I, L, E)
```

Key observations from the mockup:
- Box contains two text elements stacked vertically (letter + word)
- Rating number appears immediately to the right of the box
- Description text follows the rating number on the same line
- Each facet box is separated vertically from the next
- Fidelity level: low-fidelity ASCII wireframe (layout guide, not exact styling)

## Requirements Summary

### Functional Requirements
- Display all 7 CAWPILE facets in a vertical stack layout
- Each facet shows: box (letter + word) | rating number | description
- Large single letter (C, A, W, P, I, L, E) at top of box
- Full facet word (Characters, Atmosphere, Writing, Plot, Intrigue, Logic, Enjoyment) inside box below letter
- Rating number (1-10) positioned to the right of the box
- Description text positioned to the right of the rating number
- Boxes use consistent neutral background styling (no color-coding by score)

### User Interface Requirements
- Facets always vertically stacked (no horizontal arrangement)
- Description text hides on narrow viewports (responsive behavior)
- Rating number and box always remain visible regardless of viewport width
- Overall star ratings and letter grades remain unchanged
- Compact mode and other displays remain unchanged

### Reusability Opportunities
- This is a standalone redesign specific to the share page
- No components identified for reuse from existing features
- New component pattern may be reusable for future rating displays

### Scope Boundaries

**In Scope:**
- Redesigning CAWPILE facet display on `/share/reviews/[shareToken]`
- Implementing vertical stacked box layout per mockup
- Adding responsive behavior to hide descriptions on narrow screens
- Neutral box styling without score-based color coding

**Out of Scope:**
- CAWPILE rating modal changes
- Dashboard CAWPILE display changes
- Star rating or letter grade modifications
- Any other rating display components
- Color-coded or dynamic box styling based on scores

### Technical Considerations
- Component location: likely in `src/components/rating/` or share-specific components
- Page affected: `/share/reviews/[shareToken]` route (App Router)
- Styling approach: TailwindCSS 4 utility classes
- Responsive breakpoints: need to determine threshold for hiding descriptions
- Existing CAWPILE types defined in `src/types/cawpile.ts`
- May need to check existing share page implementation for integration points
