# Spec Requirements: Bugs in Review Sharing

## Initial Description
bugs in review sharing

## Requirements Discussion

### First Round Questions

**Q1:** What specific bugs are you seeing with the review sharing feature?
**Answer:** Two bugs identified:
- **Bug A (HTML Sanitization)**: Book descriptions contain HTML that shows as raw text. Need to strip all HTML except: `<br/>`, `<p>`, `</p>`, `<i>`, `</i>`, `<b>`, `</b>`, `<em>`, `</em>`, then render the resulting HTML properly.
- **Bug B (Height Issues)**: Site version description is too tall. Image version description is too short (~3 lines only).

**Q2:** What is the expected behavior versus the actual behavior?
**Answer:** Description should render HTML properly and have appropriate height constraints.

**Q3:** Which specific components are affected?
**Answer:** Only the sharing book description - both site version (PublicReviewDisplay) and image version (ReviewImageTemplate).

**Q4:** Does this affect all books or just certain ones?
**Answer:** Affects all books - not specific to certain books.

**Q5:** Are there any browser-specific issues or is this consistent across browsers?
**Answer:** No browser-specific issues.

**Q6:** Is there anything that should be explicitly excluded from this fix?
**Answer:** Just these two bugs, nothing else.

### Existing Code to Reference

No similar existing features identified for reference.

### Follow-up Questions

None required - user provided comprehensive answers.

## Visual Assets

### Files Provided:
- `current-site-sharing.png`: Shows the PublicReviewDisplay component with raw HTML tags visible in the description text. Tags like `<b>`, `</b>`, `<br>`, `<i>`, `</i>` are displaying as literal text instead of being rendered. The description area extends significantly, showing the height is too tall for the site version.
- `current-image-sharing.png`: Shows the ReviewImageTemplate (shareable image) with raw HTML tags visible in the description. The description is severely truncated to approximately 3 lines, cutting off mid-sentence. Same HTML rendering issue as site version.

### Visual Insights:
- Both versions display raw HTML tags as text: `<b>`, `</b>`, `<br>`, `<i>`, `</i>`, `<br><b>`, etc.
- Site version (PublicReviewDisplay): Description area is excessively tall, showing too much content
- Image version (ReviewImageTemplate): Description is truncated to ~3 lines, not enough content shown
- The book shown is "The Name of the Wind" by Patrick Rothfuss - demonstrating this affects real book data
- HTML comes from the book description field (likely sourced from external APIs like Google Books)
- Fidelity level: Production screenshots showing actual bugs

## Requirements Summary

### Functional Requirements
- Strip all HTML tags from book descriptions EXCEPT allowed tags: `<br/>`, `<p>`, `</p>`, `<i>`, `</i>`, `<b>`, `</b>`, `<em>`, `</em>`
- Render the sanitized HTML properly (not as escaped text) in both components
- Adjust height constraint for site version (PublicReviewDisplay) - currently too tall
- Adjust height constraint for image version (ReviewImageTemplate) - currently too short (~3 lines)

### Reusability Opportunities
- HTML sanitization logic could be extracted to a shared utility function for use across both components
- Height/truncation logic may benefit from a shared approach

### Scope Boundaries
**In Scope:**
- Fix HTML sanitization for book descriptions in PublicReviewDisplay
- Fix HTML sanitization for book descriptions in ReviewImageTemplate
- Adjust description height in PublicReviewDisplay (reduce)
- Adjust description height in ReviewImageTemplate (increase from ~3 lines)

**Out of Scope:**
- Other components displaying book descriptions
- Changes to how descriptions are fetched or stored
- Any other review sharing features beyond these two bugs
- Styling changes beyond height adjustments

### Technical Considerations
- Components affected: `PublicReviewDisplay`, `ReviewImageTemplate`
- Need HTML sanitization that preserves specific tags while stripping others
- Must use `dangerouslySetInnerHTML` or similar to render HTML after sanitization
- Height constraints may use CSS (max-height, line-clamp) or JavaScript truncation
- Book descriptions originate from external sources (Google Books API, etc.) which explains the HTML content
