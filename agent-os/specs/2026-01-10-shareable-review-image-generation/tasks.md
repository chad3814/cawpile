# Task Breakdown: Shareable Review Image Generation

## Overview
Total Tasks: 4 Task Groups, ~20 Sub-tasks

This feature enables users to generate downloadable social media images (1080x1920) from their book reviews for Instagram Stories/TikTok. The implementation is entirely client-side using html2canvas, extending the existing ShareReviewModal.

## Task List

### Frontend Setup

#### Task Group 1: Dependencies and Utility Layer
**Dependencies:** None

- [x] 1.0 Complete dependencies and utility layer
  - [x] 1.1 Write 2-4 focused tests for image generation utilities
    - Test slugify function for filename generation
    - Test text truncation logic for review text
    - Test color utility functions for image theme
  - [x] 1.2 Install html2canvas dependency
    - Run `npm install html2canvas`
    - Verify TypeScript types available (`@types/html2canvas` if needed)
  - [x] 1.3 Create image generation utility functions
    - File: `/src/lib/image/generateReviewImage.ts`
    - Function: `slugifyBookTitle(title: string): string` for filename
    - Function: `truncateReviewText(text: string, maxChars: number): string` with ellipsis
    - Function: `downloadImage(dataUrl: string, filename: string): void` using blob download
  - [x] 1.4 Create image theme constants
    - File: `/src/lib/image/imageTheme.ts`
    - Constants: `IMAGE_WIDTH = 1080`, `IMAGE_HEIGHT = 1920`
    - Colors: `BG_COLOR = '#0f172a'`, `TEXT_COLOR = '#ffffff'`, `ACCENT_COLOR = '#f97316'`
    - Typography sizes for title, author, facets, review text
  - [x] 1.5 Ensure utility layer tests pass
    - Run ONLY the 2-4 tests written in 1.1
    - Verify functions work correctly in isolation

**Acceptance Criteria:**
- html2canvas installed and importable
- Utility functions work correctly (slugify, truncate, download)
- Theme constants defined for consistent image styling
- Tests pass for utility functions

### Image Template Component

#### Task Group 2: Review Image Template
**Dependencies:** Task Group 1

- [x] 2.0 Complete review image template component
  - [x] 2.1 Write 2-4 focused tests for ReviewImageTemplate
    - Test component renders with complete book data
    - Test component handles missing book cover gracefully
    - Test component respects privacy settings (showDates, showBookClubs, showReadathons)
    - Test review text truncation displays correctly
  - [x] 2.2 Create ReviewImageTemplate component
    - File: `/src/components/share/ReviewImageTemplate.tsx`
    - Fixed dimensions: 1080x1920 pixels (inline styles for html2canvas)
    - Dark background (#0f172a), white text, orange accents (#f97316)
    - Must use inline styles (not Tailwind classes) for html2canvas compatibility
  - [x] 2.3 Implement book cover section
    - Display book cover image prominently (handle missing with placeholder)
    - Use Next.js Image with `unoptimized` prop for html2canvas compatibility
    - Position at top of template with appropriate sizing
  - [x] 2.4 Implement book metadata section
    - Display book title with clear typography
    - Display author name(s) below title
    - Reference pattern from PublicReviewDisplay
  - [x] 2.5 Implement CAWPILE rating display
    - Show all 7 facet scores with facet names
    - Use getFacetConfig() for correct fiction/non-fiction facet names
    - Apply getCawpileColor() logic for score-based coloring (inline hex values)
    - Display overall average numerically (e.g., "7.8/10")
    - Display star rating using getStarEmojis()
  - [x] 2.6 Implement review text section
    - Display written review text from userBook.review
    - Truncate with "..." if exceeds available space
    - Handle empty/null review gracefully (omit section)
  - [x] 2.7 Implement conditional metadata section
    - Conditionally display reading dates based on showDates
    - Conditionally display book club name based on showBookClubs
    - Conditionally display readathon name based on showReadathons
  - [x] 2.8 Add Cawpile branding footer
    - "Powered by Cawpile" or Cawpile wordmark at bottom
    - Orange accent color for branding element
    - Consistent padding from bottom edge
  - [x] 2.9 Ensure ReviewImageTemplate tests pass
    - Run ONLY the 2-4 tests written in 2.1
    - Verify component renders correctly with various data states

**Acceptance Criteria:**
- Component renders at exact 1080x1920 dimensions
- All required content displays: cover, title, author, 7 facets, average, stars, review, branding
- Privacy settings correctly show/hide conditional metadata
- Missing book covers handled with placeholder
- Long review text truncates gracefully

### Image Generation Integration

#### Task Group 3: ShareReviewModal Integration
**Dependencies:** Task Group 2

- [x] 3.0 Complete ShareReviewModal integration
  - [x] 3.1 Write 2-4 focused tests for image generation flow
    - Test "Generate Image" button appears in modal
    - Test clicking button triggers image generation
    - Test preview state displays generated image
    - Test download button triggers file download
  - [x] 3.2 Extend ShareReviewModalProps interface
    - Add userBook fields needed for image: cawpileRating, review, startDate, finishDate, bookType
    - Ensure all data from PublicReviewDisplay props is available
    - File: `/src/components/modals/ShareReviewModal.tsx`
  - [x] 3.3 Add image generation state management
    - Add state: `imageGenerating: boolean`
    - Add state: `generatedImageUrl: string | null`
    - Add state: `imageError: string | null`
    - Add state: `showImagePreview: boolean`
  - [x] 3.4 Implement "Generate Image" button
    - Add button in action buttons section
    - Position alongside existing URL sharing functionality
    - Disable during generation (show loading state)
    - Only enable when book has CAWPILE rating (same eligibility as URL sharing)
  - [x] 3.5 Implement image generation handler
    - Create hidden container for ReviewImageTemplate
    - Use html2canvas to capture template as image
    - Store generated data URL in state
    - Handle errors with user-friendly message
    - Reference: `html2canvas(element, { scale: 1, width: 1080, height: 1920 })`
  - [x] 3.6 Implement image preview view
    - Show loading spinner during generation
    - Display generated image scaled to fit modal viewport
    - Maintain aspect ratio (9:16) in preview
  - [x] 3.7 Implement preview action buttons
    - "Download" button: triggers `downloadImage()` utility
    - "Back" button: returns to main share options
    - Filename format: `cawpile-review-{book-title-slug}.png`
  - [x] 3.8 Handle generation edge cases
    - Loading state with spinner during generation
    - Error state with user-friendly message
    - Handle missing cover images in template
    - Handle empty review text
  - [x] 3.9 Ensure ShareReviewModal integration tests pass
    - Run ONLY the 2-4 tests written in 3.1
    - Verify image generation flow works end-to-end

**Acceptance Criteria:**
- "Generate Image" button visible in ShareReviewModal
- Image generates correctly using html2canvas
- Preview displays generated image at correct aspect ratio
- Download triggers browser download with correct filename
- Error states handled gracefully with user feedback
- Back button returns to main share view

### Testing

#### Task Group 4: Test Review and Gap Analysis
**Dependencies:** Task Groups 1-3

- [x] 4.0 Review existing tests and fill critical gaps only
  - [x] 4.1 Review tests from Task Groups 1-3
    - Review the 2-4 tests written for utilities (Task 1.1)
    - Review the 2-4 tests written for ReviewImageTemplate (Task 2.1)
    - Review the 2-4 tests written for ShareReviewModal integration (Task 3.1)
    - Total existing tests: approximately 6-12 tests
  - [x] 4.2 Analyze test coverage gaps for THIS feature only
    - Identify critical user workflows that lack test coverage
    - Focus ONLY on gaps related to image generation feature
    - Do NOT assess entire application test coverage
    - Prioritize end-to-end image generation flow over unit test gaps
  - [x] 4.3 Write up to 6 additional strategic tests maximum
    - Test image generation with fiction vs non-fiction book types
    - Test image generation with all privacy settings combinations
    - Test download functionality across different browsers (if practical)
    - Test error handling when html2canvas fails
    - Do NOT write comprehensive coverage for all scenarios
    - Skip edge cases, performance tests unless business-critical
  - [x] 4.4 Run feature-specific tests only
    - Run ONLY tests related to this spec's feature (tests from 1.1, 2.1, 3.1, and 4.3)
    - Expected total: approximately 12-18 tests maximum
    - Do NOT run the entire application test suite
    - Verify critical workflows pass

**Acceptance Criteria:**
- All feature-specific tests pass (approximately 12-18 tests total)
- Critical user workflows for image generation are covered
- No more than 6 additional tests added when filling in testing gaps
- Testing focused exclusively on this spec's feature requirements

## Execution Order

Recommended implementation sequence:
1. **Dependencies and Utility Layer** (Task Group 1) - Foundation for image generation
2. **Review Image Template** (Task Group 2) - Visual component for image content
3. **ShareReviewModal Integration** (Task Group 3) - User-facing feature integration
4. **Test Review and Gap Analysis** (Task Group 4) - Quality verification

## Technical Notes

### html2canvas Considerations
- Use inline styles instead of Tailwind classes (html2canvas captures computed styles)
- Set explicit dimensions on template container
- Use `unoptimized` prop on Next.js Image components
- Consider `useCORS: true` option for external book cover images
- May need `allowTaint: true` or proxy for cross-origin images

### Key Files to Create
- `/src/lib/image/generateReviewImage.ts` - Utility functions
- `/src/lib/image/imageTheme.ts` - Theme constants
- `/src/components/share/ReviewImageTemplate.tsx` - Image template component

### Key Files to Modify
- `/src/components/modals/ShareReviewModal.tsx` - Add image generation option

### Existing Code to Reference
- `/src/components/share/PublicReviewDisplay.tsx` - Layout structure and data access patterns
- `/src/components/rating/CawpileFacetDisplay.tsx` - Facet rendering logic
- `/src/components/rating/StarRating.tsx` - Star display logic
- `/src/types/cawpile.ts` - getFacetConfig, getCawpileColor, convertToStars, getStarEmojis

### Design Specifications
- Image dimensions: 1080x1920 pixels (9:16 aspect ratio)
- Background: #0f172a (slate-900)
- Text: #ffffff (white)
- Accent: #f97316 (orange-500)
- Format: PNG
- Filename pattern: `cawpile-review-{book-title-slug}.png`
