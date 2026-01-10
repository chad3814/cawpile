# Spec Requirements: Sharing Review Text and Description Fix

## Initial Description
**Bug fix for the sharing feature** - when sharing there is no option to enable or disable the review text, it should be opt-out. Also, we should include the book description under the star rating at the top, but truncate it at the horizontal line at the bottom of the image.

## Requirements Discussion

### First Round Questions

**Q1:** For the review text toggle, I assume you want it enabled by default (opt-out behavior), meaning the review text shows unless the user explicitly unchecks a toggle. Is that correct, or should it be opt-in (hidden by default)?
**Answer:** Correct - enabled by default with checkbox to hide it, like existing privacy toggles.

**Q2:** Should this toggle affect both the shareable link page (PublicReviewDisplay) AND the generated image (ReviewImageTemplate), or just the image?
**Answer:** Yes, both - affects shareable link page (PublicReviewDisplay) AND generated image (ReviewImageTemplate).

**Q3:** For the book description placement, I'm thinking it should appear as a new section below the existing rating box (stars + grade) but still in the header area, before the CAWPILE Rating section. Is that the intended location?
**Answer:** Yes, correct - add as new section below the rating box, still in the header area before CAWPILE Rating section.

**Q4:** You mentioned truncating at the "horizontal line at the bottom of the image" - I assume you mean the footer separator line. Should the description be cut off with an ellipsis if it exceeds the available space?
**Answer:** No, NOT truncated at the footer line. It should only extend as far as the book cover image - keep it within that header area (constrained to the height of the book cover).

**Q5:** Where should the description come from - the GoogleBook metadata? And if no description exists for a book, should we hide that section entirely or show placeholder text?
**Answer:** If no description exists, hide the section entirely.

**Q6:** Should the book description also appear on the public shareable review page (not just the image), for consistency?
**Answer:** Yes, should be on both the public shareable review page AND the generated image.

**Q7:** Is there anything you explicitly want to exclude from this feature? For example, should we avoid adding any new API endpoints or database changes?
**Answer:** None specified.

### Existing Code to Reference

**Similar Features Identified:**
- Feature: ShareReviewModal - Path: User mentioned "existing opt-out controls in the share modal (ShareReviewModal)"
- Components to potentially reuse: Existing toggle/checkbox pattern from ShareReviewModal for review text visibility
- Backend logic to reference: Current sharing toggle state management pattern

### Follow-up Questions

No follow-up questions were needed.

## Visual Assets

### Files Provided:
No visual assets provided.

### Visual Insights:
N/A - No visual files found in the visuals folder.

## Requirements Summary

### Functional Requirements
- Add a toggle control for review text visibility in the ShareReviewModal
- Toggle should be enabled by default (opt-out behavior) - review text shows unless user unchecks
- Review text visibility toggle affects both:
  - PublicReviewDisplay (shareable link page)
  - ReviewImageTemplate (generated image for social media)
- Add book description section to the header area:
  - Position: Below the star rating/grade box, before CAWPILE Rating section
  - Constraint: Must stay within the height of the book cover image (not extend below it)
  - Source: GoogleBook metadata description
  - Visibility: Hide section entirely if no description exists
- Book description appears on both:
  - Public shareable review page
  - Generated share image

### Reusability Opportunities
- Existing toggle/checkbox pattern from ShareReviewModal for the review text visibility control
- Current state management pattern for sharing toggles
- GoogleBook metadata already available (description field)

### Scope Boundaries
**In Scope:**
- Review text visibility toggle (opt-out, enabled by default)
- Book description display in header area (constrained to book cover height)
- Updates to PublicReviewDisplay component
- Updates to ReviewImageTemplate component
- Updates to ShareReviewModal for new toggle control
- Passing visibility state through sharing flow

**Out of Scope:**
- No new API endpoints required (using existing sharing flow)
- No database schema changes (toggle state handled client-side or in existing share link params)
- No changes to the CAWPILE rating display itself
- No changes to the footer area

### Technical Considerations
- Description truncation logic: Must calculate available height based on book cover dimensions and truncate with ellipsis if needed
- State management: Review text visibility toggle needs to flow from ShareReviewModal to both PublicReviewDisplay and ReviewImageTemplate
- Image generation: ReviewImageTemplate must handle dynamic content height while staying within book cover bounds
- Graceful degradation: If GoogleBook description is null/undefined/empty, hide description section completely
- Similar patterns to follow: Existing privacy toggle implementation in ShareReviewModal
