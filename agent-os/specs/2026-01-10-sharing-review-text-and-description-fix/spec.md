# Specification: Sharing Review Text and Description Fix

## Goal
Add a review text visibility toggle (opt-out, enabled by default) to the share modal, and display the book description from GoogleBook metadata in the header area of both the public shareable page and generated image.

## User Stories
- As a user sharing my review, I want to optionally hide my review text so that I can share my CAWPILE rating without exposing my written thoughts
- As a user viewing a shared review, I want to see the book description so that I understand what the book is about

## Specific Requirements

**Review Text Visibility Toggle**
- Add a new checkbox toggle in ShareReviewModal under Privacy Settings section
- Toggle should be enabled by default (checked = show review text), following opt-out pattern
- Label: "Show review text" with disabled state text "(no review)" if no review exists
- Follow existing toggle pattern from showDates, showBookClubs, showReadathons checkboxes
- New state variable: `showReview` initialized to `existingShare?.showReview ?? true`
- Disable toggle if `userBook.review` is null/empty (same pattern as book clubs toggle)

**Review Toggle State Flow**
- Pass `showReview` in POST/PATCH request body to `/api/user/books/[id]/share`
- Add `showReview` field to SharedReview model (Boolean, default true)
- Include `showReview` in API responses and database persistence
- Pass `showReview` through privacySettings to ReviewImageTemplate and PublicReviewDisplay

**Review Text Conditional Rendering**
- In PublicReviewDisplay: wrap Review section with `sharedReview.showReview && review` condition
- In ReviewImageTemplate: wrap Review section with `privacySettings.showReview && truncatedReview` condition
- Existing check `truncatedReview &&` and `review &&` should be combined with new toggle check

**Book Description Display - Public Page**
- Add description section in PublicReviewDisplay below the star rating box, before CAWPILE Rating section
- Source: `edition.googleBook?.description`
- Constrain description height to match book cover height (aspect-[2/3] container = 288px on w-48)
- Use CSS `max-h-` with `overflow-hidden` and text truncation with ellipsis
- Hide section entirely if description is null/undefined/empty string
- Style: muted text color, smaller font size, pre-wrap for paragraph formatting

**Book Description Display - Generated Image**
- Add description section in ReviewImageTemplate below the rating box, inside Book Info area
- Constraint: must stay within the 360px height of the book cover image
- Calculate available space: 360px (cover) - title height - author height - rating box height
- Apply inline styles for max-height, overflow hidden, and text-overflow ellipsis
- Use smaller font size (16-18px) with muted color for description text
- Hide section if `book.description` is null/undefined/empty

**Data Flow Updates**
- Extend ShareReviewModal userBook interface to include googleBook.description
- Extend ReviewImageTemplateProps book interface with optional description field
- Extend PublicReviewDisplayProps to access description from googleBook
- Ensure share page query includes googleBook relation (already included)

## Existing Code to Leverage

**ShareReviewModal Toggle Pattern (lines 464-502)**
- Checkbox with label, checked state, onChange handler
- Disabled state pattern with conditional styling and "(not set)" text
- State variables initialized from existingShare with nullish coalescing

**ReviewImageTemplate Structure (lines 209-237)**
- Rating box positioned below author, before CAWPILE section
- Uses MUTED_BG color and 12px border radius for contained sections
- Inline styles required for html2canvas compatibility

**PublicReviewDisplay Layout (lines 95-111)**
- Rating box uses bg-muted/50 rounded-lg with p-4 padding
- Positioned after author paragraph, before CAWPILE Rating section
- Uses TailwindCSS classes for styling

**Share API Route (lines 130-139, 217-227)**
- Privacy settings passed in request body and stored in SharedReview
- Boolean fields with default true pattern
- PATCH handles partial updates with undefined checks

**Public Share Page Query (lines 52-67)**
- Already includes googleBook relation in the query
- Description field available via edition.googleBook.description

## Out of Scope
- New API endpoints (use existing share API with added field)
- Changes to CAWPILE rating display or calculation
- Changes to the footer area or branding
- Changes to metadata section (reading details)
- Image generation preview behavior changes
- Copy URL or download functionality changes
- Authentication or authorization changes
- Mobile-specific responsive design changes beyond existing patterns
- Database migration beyond adding single Boolean field to SharedReview
- Changes to book search or book detail pages
